import AsyncStorage from '@react-native-async-storage/async-storage';

// ========== 类型定义 ==========

interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface Worker {
  id: number;
  name: string;
  role?: string;
  createdAt: string;
}

interface WorkLog {
  id: number;
  projectId: number;
  projectName: string;
  workerId: number;
  workerName: string;
  workDate: string;
  hours: number;
  description?: string;
  createdAt: string;
}

interface WorkerHours {
  workerId: number;
  workerName: string;
  totalHours: number;
}

interface ProjectHours {
  projectId: number;
  projectName: string;
  totalHours: number;
}

// ========== Storage Keys ==========

const STORAGE_KEYS = {
  PROJECTS: '@workhours_projects',
  WORKERS: '@workhours_workers',
  WORK_LOGS: '@workhours_work_logs',
};

// ========== 通用 CRUD 函数 ==========

async function getAll<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

function generateId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map(item => item.id)) + 1;
}

// ========== 项目服务 ==========

const projectService = {
  getAll: async (): Promise<Project[]> => {
    return getAll<Project>(STORAGE_KEYS.PROJECTS);
  },

  getById: async (id: number): Promise<Project | null> => {
    const projects = await projectService.getAll();
    return projects.find(p => p.id === id) || null;
  },

  create: async (data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const projects = await projectService.getAll();
    const newProject: Project = {
      ...data,
      id: generateId(projects),
      createdAt: new Date().toISOString(),
    };
    await saveAll(STORAGE_KEYS.PROJECTS, [...projects, newProject]);
    return newProject;
  },

  update: async (id: number, data: Partial<Project>): Promise<Project | null> => {
    const projects = await projectService.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updatedProject = { ...projects[index], ...data };
    const newProjects = [...projects];
    newProjects[index] = updatedProject;
    await saveAll(STORAGE_KEYS.PROJECTS, newProjects);
    return updatedProject;
  },

  delete: async (id: number): Promise<boolean> => {
    const projects = await projectService.getAll();
    const newProjects = projects.filter(p => p.id !== id);
    await saveAll(STORAGE_KEYS.PROJECTS, newProjects);
    return true;
  },
};

// ========== 人员服务 ==========

const workerService = {
  getAll: async (): Promise<Worker[]> => {
    return getAll<Worker>(STORAGE_KEYS.WORKERS);
  },

  getById: async (id: number): Promise<Worker | null> => {
    const workers = await workerService.getAll();
    return workers.find(w => w.id === id) || null;
  },

  create: async (data: Omit<Worker, 'id' | 'createdAt'>): Promise<Worker> => {
    const workers = await workerService.getAll();
    const newWorker: Worker = {
      ...data,
      id: generateId(workers),
      createdAt: new Date().toISOString(),
    };
    await saveAll(STORAGE_KEYS.WORKERS, [...workers, newWorker]);
    return newWorker;
  },

  update: async (id: number, data: Partial<Worker>): Promise<Worker | null> => {
    const workers = await workerService.getAll();
    const index = workers.findIndex(w => w.id === id);
    if (index === -1) return null;
    
    const updatedWorker = { ...workers[index], ...data };
    const newWorkers = [...workers];
    newWorkers[index] = updatedWorker;
    await saveAll(STORAGE_KEYS.WORKERS, newWorkers);
    return updatedWorker;
  },

  delete: async (id: number): Promise<boolean> => {
    const workers = await workerService.getAll();
    const newWorkers = workers.filter(w => w.id !== id);
    await saveAll(STORAGE_KEYS.WORKERS, newWorkers);
    return true;
  },
};

// ========== 工时记录服务 ==========

const workLogService = {
  getAll: async (): Promise<WorkLog[]> => {
    return getAll<WorkLog>(STORAGE_KEYS.WORK_LOGS);
  },

  getByProjectId: async (projectId: number): Promise<WorkLog[]> => {
    const logs = await workLogService.getAll();
    return logs.filter(log => log.projectId === projectId);
  },

  getByWorkerId: async (workerId: number): Promise<WorkLog[]> => {
    const logs = await workLogService.getAll();
    return logs.filter(log => log.workerId === workerId);
  },

  getByDate: async (date: string): Promise<WorkLog[]> => {
    const logs = await workLogService.getAll();
    return logs.filter(log => log.workDate === date);
  },

  create: async (data: Omit<WorkLog, 'id' | 'createdAt'>): Promise<WorkLog> => {
    const logs = await workLogService.getAll();
    const newLog: WorkLog = {
      ...data,
      id: generateId(logs),
      createdAt: new Date().toISOString(),
    };
    await saveAll(STORAGE_KEYS.WORK_LOGS, [...logs, newLog]);
    return newLog;
  },

  update: async (id: number, data: Partial<WorkLog>): Promise<WorkLog | null> => {
    const logs = await workLogService.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index === -1) return null;
    
    const updatedLog = { ...logs[index], ...data };
    const newLogs = [...logs];
    newLogs[index] = updatedLog;
    await saveAll(STORAGE_KEYS.WORK_LOGS, newLogs);
    return updatedLog;
  },

  delete: async (id: number): Promise<boolean> => {
    const logs = await workLogService.getAll();
    const newLogs = logs.filter(log => log.id !== id);
    await saveAll(STORAGE_KEYS.WORK_LOGS, newLogs);
    return true;
  },

  // 获取月度统计（按人员）
  getMonthlyStats: async (year: number, month: number): Promise<WorkerHours[]> => {
    const logs = await workLogService.getAll();
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.workDate);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });

    const workerMap = new Map<number, WorkerHours>();

    filteredLogs.forEach(log => {
      const existing = workerMap.get(log.workerId);
      if (existing) {
        existing.totalHours += log.hours;
      } else {
        workerMap.set(log.workerId, {
          workerId: log.workerId,
          workerName: log.workerName,
          totalHours: log.hours,
        });
      }
    });

    return Array.from(workerMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  },

  // 获取项目月度统计
  getProjectStats: async (year: number, month: number): Promise<ProjectHours[]> => {
    const logs = await workLogService.getAll();
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.workDate);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });

    const projectMap = new Map<number, ProjectHours>();

    filteredLogs.forEach(log => {
      const existing = projectMap.get(log.projectId);
      if (existing) {
        existing.totalHours += log.hours;
      } else {
        projectMap.set(log.projectId, {
          projectId: log.projectId,
          projectName: log.projectName,
          totalHours: log.hours,
        });
      }
    });

    return Array.from(projectMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  },
};

// ========== 数据导出/导入 ==========

// 导出所有数据
async function exportAllData(): Promise<string> {
  try {
    const projects = await projectService.getAll();
    const workers = await workerService.getAll();
    const workLogs = await workLogService.getAll();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        projects,
        workers,
        workLogs,
      },
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('导出数据失败:', error);
    throw error;
  }
}

// 导入所有数据
async function importAllData(jsonString: string) {
  try {
    const importData = JSON.parse(jsonString);

    // 验证数据格式
    if (!importData.data || !importData.data.projects || !importData.data.workers || !importData.data.workLogs) {
      throw new Error('数据格式不正确');
    }

    // 清空旧数据
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROJECTS,
      STORAGE_KEYS.WORKERS,
      STORAGE_KEYS.WORK_LOGS,
    ]);

    // 导入新数据
    await saveAll(STORAGE_KEYS.PROJECTS, importData.data.projects);
    await saveAll(STORAGE_KEYS.WORKERS, importData.data.workers);
    await saveAll(STORAGE_KEYS.WORK_LOGS, importData.data.workLogs);

    return {
      projectsCount: importData.data.projects.length,
      workersCount: importData.data.workers.length,
      workLogsCount: importData.data.workLogs.length,
    };
  } catch (error) {
    console.error('导入数据失败:', error);
    throw error;
  }
}

// ========== 导出 ==========

module.exports = {
  projectService,
  workerService,
  workLogService,
  exportAllData,
  importAllData,
};
