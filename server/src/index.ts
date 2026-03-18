import express from "express";
import cors from "cors";
import multer from "multer";
import { S3Storage } from "coze-coding-dev-sdk";
import * as XLSX from 'xlsx';

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 配置 multer 用于接收文件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 限制 50MB
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

/**
 * 上传单个文件
 * 返回对象存储的 key 和签名 URL
 */
app.post('/api/v1/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未提供文件' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: `delivery-images/${Date.now()}_${originalname}`,
      contentType: mimetype,
    });

    // 生成签名 URL（有效期 30 天）
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000, // 30 天
    });

    res.json({
      success: true,
      key: fileKey,
      url: signedUrl,
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({ error: '上传文件失败' });
  }
});

/**
 * 批量上传文件
 */
app.post('/api/v1/upload/batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: '未提供文件' });
    }

    const results = [];

    for (const file of req.files) {
      const { buffer, originalname, mimetype } = file;

      // 上传到对象存储
      const fileKey = await storage.uploadFile({
        fileContent: buffer,
        fileName: `delivery-images/${Date.now()}_${originalname}`,
        contentType: mimetype,
      });

      // 生成签名 URL
      const signedUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 2592000,
      });

      results.push({
        key: fileKey,
        url: signedUrl,
      });
    }

    res.json({
      success: true,
      files: results,
    });
  } catch (error) {
    console.error('批量上传文件失败:', error);
    res.status(500).json({ error: '批量上传文件失败' });
  }
});

/**
 * 根据 key 获取文件签名 URL
 */
app.post('/api/v1/file/url', async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: '未提供文件 key' });
    }

    const urls = await Promise.all(
      keys.map(async (key: string) => {
        const url = await storage.generatePresignedUrl({
          key,
          expireTime: 2592000, // 30 天
        });
        return { key, url };
      })
    );

    res.json({
      success: true,
      urls,
    });
  } catch (error) {
    console.error('获取文件 URL 失败:', error);
    res.status(500).json({ error: '获取文件 URL 失败' });
  }
});

/**
 * 导出Excel报表
 * 接收数据并生成Excel文件，上传到对象存储后返回下载链接
 */
app.post('/api/v1/export/excel', async (req, res) => {
  try {
    const { type, data, projectName } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const workbook = XLSX.utils.book_new();
    
    switch (type) {
      case 'transactions': {
        // 支出明细表
        const wsData = [
          ['日期', '项目', '描述', '金额', '分类', '采购单位', '是否开票', '是否付款'],
          ...data.map((t: any) => [
            t.date,
            t.projectName || '',
            t.description,
            t.amount,
            t.categoryName || '',
            t.purchaseUnit || '',
            t.isInvoiced ? '是' : '否',
            t.isPaid ? '是' : '否',
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, '支出明细');
        break;
      }
      case 'projects': {
        // 项目汇总表
        const wsData = [
          ['项目名称', '类型', '状态', '总支出', '总收入', '净利润', '利润率'],
          ...data.map((p: any) => [
            p.name,
            p.typeName,
            p.statusName,
            p.totalExpense,
            p.totalIncome,
            p.netProfit,
            p.profitRate ? `${p.profitRate}%` : '-',
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, '项目汇总');
        break;
      }
      case 'delivery': {
        // 送货记录表
        const wsData = [
          ['日期', '项目', '描述', '金额', '已开票', '已收款', '待收款'],
          ...data.map((d: any) => [
            d.date,
            d.projectName,
            d.description,
            d.amount,
            d.invoiceAmount,
            d.receivedAmount,
            d.amount - d.receivedAmount,
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, '送货记录');
        break;
      }
      case 'report': {
        // 财务报表（多sheet）
        // 收入明细
        if (data.incomes && data.incomes.length > 0) {
          const incomeWs = XLSX.utils.aoa_to_sheet([
            ['日期', '项目', '金额', '描述'],
            ...data.incomes.map((i: any) => [i.date, i.projectName, i.amount, i.description || '']),
          ]);
          XLSX.utils.book_append_sheet(workbook, incomeWs, '收入明细');
        }
        // 支出明细
        if (data.expenses && data.expenses.length > 0) {
          const expenseWs = XLSX.utils.aoa_to_sheet([
            ['日期', '项目', '描述', '金额', '分类'],
            ...data.expenses.map((e: any) => [e.date, e.projectName, e.description, e.amount, e.categoryName || '']),
          ]);
          XLSX.utils.book_append_sheet(workbook, expenseWs, '支出明细');
        }
        // 汇总
        if (data.summary) {
          const summaryWs = XLSX.utils.aoa_to_sheet([
            ['统计项目', '金额'],
            ['总收入', data.summary.totalIncome],
            ['总支出', data.summary.totalExpense],
            ['净利润', data.summary.netProfit],
          ]);
          XLSX.utils.book_append_sheet(workbook, summaryWs, '汇总');
        }
        break;
      }
      default:
        return res.status(400).json({ error: '不支持的导出类型' });
    }

    // 生成Excel文件buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 生成文件名
    const fileName = `${type}_${projectName || 'report'}_${Date.now()}.xlsx`;
    
    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: `exports/${fileName}`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 获取下载链接
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1小时有效
    });

    res.json({
      success: true,
      url: downloadUrl,
      fileName,
    });
  } catch (error) {
    console.error('导出Excel失败:', error);
    res.status(500).json({ error: '导出Excel失败' });
  }
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '文件大小超过限制（最大 50MB）' });
  }
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
