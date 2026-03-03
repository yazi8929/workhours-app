import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键
const STORAGE_KEYS = {
  PROJECTS: 'workhours_projects',
  WORKERS: 'workhours_workers',
  WORK_LOGS: 'workhours_worklogs',
};

// 生成唯一 ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ===== 项目管理 =====
export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export const projectService = {
  // 获取所有项目
  async getProjects(): Promise<Project[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return [];
    }
  },

  // 创建项目
  async createProject(name: string): Promise<Project> {
    try {
      const projects = await this.getProjects();
      const newProject: Project = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
      };
      projects.push(newProject);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      return newProject;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  },

  // 更新项目
  async updateProject(id: string, name: string): Promise<void> {
    try {
      const projects = await this.getProjects();
      const index = projects.findIndex(p => p.id === id);
      if (index !== -1) {
        projects[index].name = name;
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      }
    } catch (error) {
      console.error('更新项目失败:', error);
      throw error;
    }
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    try {
      const projects = await this.getProjects();
      const filtered = projects.filter(p => p.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('删除项目失败:', error);
      throw error;
    }
  },
};

// ===== 人员管理 =====
export interface Worker {
  id: string;
  name: string;
  createdAt: string;
}

export const workerService = {
  // 获取所有人员
  async getWorkers(): Promise<Worker[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取人员列表失败:', error);
      return [];
    }
  },

  // 创建人员
  async createWorker(name: string): Promise<Worker> {
    try {
      const workers = await this.getWorkers();
      const newWorker: Worker = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
      };
      workers.push(newWorker);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
      return newWorker;
    } catch (error) {
      console.error('创建人员失败:', error);
      throw error;
    }
  },

  // 更新人员
  async updateWorker(id: string, name: string): Promise<void> {
    try {
      const workers = await this.getWorkers();
      const index = workers.findIndex(w => w.id === id);
      if (index !== -1) {
        workers[index].name = name;
        await AsyncStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
      }
    } catch (error) {
      console.error('更新人员失败:', error);
      throw error;
    }
  },

  // 删除人员
  async deleteWorker(id: string): Promise<void> {
    try {
      const workers = await this.getWorkers();
      const filtered = workers.filter(w => w.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(filtered));
    } catch (error) {
      console.error('删除人员失败:', error);
      throw error;
    }
  },
};

// ===== 工时记录 =====
export interface WorkerHours {
  id: string;
  hours: number;
}

export interface WorkLog {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  description: string;
  workers: WorkerHours[];
  createdAt: string;
}

export const workLogService = {
  // 获取所有工时记录
  async getWorkLogs(): Promise<WorkLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WORK_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取工时记录失败:', error);
      return [];
    }
  },

  // 创建工时记录
  async createWorkLog(
    projectId: string,
    projectName: string,
    date: string,
    description: string,
    workers: WorkerHours[]
  ): Promise<WorkLog> {
    try {
      const workLogs = await this.getWorkLogs();
      const newWorkLog: WorkLog = {
        id: generateId(),
        projectId,
        projectName,
        date,
        description,
        workers,
        createdAt: new Date().toISOString(),
      };
      workLogs.unshift(newWorkLog); // 添加到开头
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(workLogs));
      return newWorkLog;
    } catch (error) {
      console.error('创建工时记录失败:', error);
      throw error;
    }
  },

  // 更新工时记录
  async updateWorkLog(
    id: string,
    projectId: string,
    projectName: string,
    date: string,
    description: string,
    workers: WorkerHours[]
  ): Promise<void> {
    try {
      const workLogs = await this.getWorkLogs();
      const index = workLogs.findIndex(w => w.id === id);
      if (index !== -1) {
        workLogs[index] = {
          ...workLogs[index],
          projectId,
          projectName,
          date,
          description,
          workers,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(workLogs));
      }
    } catch (error) {
      console.error('更新工时记录失败:', error);
      throw error;
    }
  },

  // 删除工时记录
  async deleteWorkLog(id: string): Promise<void> {
    try {
      const workLogs = await this.getWorkLogs();
      const filtered = workLogs.filter(w => w.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('删除工时记录失败:', error);
      throw error;
    }
  },

  // 获取月度统计
  async getMonthlyStats(year: number, month: number): Promise<{
    projectStats: Array<{
      projectId: string;
      projectName: string;
      workers: Array<{
        workerId: string;
        workerName: string;
        totalHours: number;
      }>;
    }>;
  }> {
    try {
      const workLogs = await this.getWorkLogs();
      const workers = await workerService.getWorkers();

      // 筛选指定年月的记录
      const filteredLogs = workLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
      });

      // 按项目分组统计
      const projectMap = new Map<string, Map<string, number>>();

      filteredLogs.forEach(log => {
        if (!projectMap.has(log.projectId)) {
          projectMap.set(log.projectId, new Map());
        }
        const workerMap = projectMap.get(log.projectId)!;

        log.workers.forEach(w => {
          const currentHours = workerMap.get(w.id) || 0;
          workerMap.set(w.id, currentHours + w.hours);
        });
      });

      // 转换为数组格式
      const projectStats = Array.from(projectMap.entries()).map(([projectId, workerMap]) => {
        const workerStats = Array.from(workerMap.entries()).map(([workerId, totalHours]) => {
          const worker = workers.find(w => w.id === workerId);
          return {
            workerId,
            workerName: worker?.name || '未知',
            totalHours,
          };
        });

        return {
          projectId,
          projectName: filteredLogs.find(l => l.projectId === projectId)?.projectName || '未知',
          workers: workerStats,
        };
      });

      return { projectStats };
    } catch (error) {
      console.error('获取月度统计失败:', error);
      return { projectStats: [] };
    }
  },
};
