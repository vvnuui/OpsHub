<template>
  <div class="user-manage-container">
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建用户
      </el-button>
    </div>

    <!-- 用户列表 -->
    <el-table
      :data="userList"
      v-loading="loading"
      class="user-table"
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="full_name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="getRoleType(row.role)">
            {{ getRoleLabel(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login_time" label="最后登录" width="180" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            @click="handleManageAccess(row)"
          >
            系统授权
          </el-button>
          <el-button
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row)"
            :disabled="row.id === currentUserId"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="userForm.full_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="审计员" value="auditor" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 系统授权对话框 -->
    <el-dialog
      v-model="accessDialogVisible"
      title="系统访问授权"
      width="600px"
    >
      <div v-if="currentUser">
        <el-alert
          v-if="currentUser.role === 'admin' || currentUser.role === 'auditor'"
          :title="`${getRoleLabel(currentUser.role)}默认拥有所有系统访问权限，无需单独授权`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />
        <div v-else>
          <el-checkbox-group v-model="selectedSystems">
            <el-checkbox
              v-for="system in allSystems"
              :key="system.id"
              :value="system.id"
              :label="system.id"
            >
              {{ system.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="accessDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSaveAccess"
          :loading="savingAccess"
          :disabled="currentUser?.role === 'admin' || currentUser?.role === 'auditor'"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth.js';
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getUserSystems,
  grantSystemAccess
} from '../api/user.js';
import { systemAPI } from '../api/system.js';

const authStore = useAuthStore();

// 当前登录用户ID
const currentUserId = computed(() => authStore.user?.id);

// 用户列表
const userList = ref([]);
const loading = ref(false);

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitting = ref(false);

// 用户表单
const userFormRef = ref(null);
const userForm = ref({
  id: null,
  username: '',
  password: '',
  email: '',
  full_name: '',
  role: 'user',
  status: 'active'
});

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: (rule, value, callback) => {
      if (!isEdit.value && !value) {
        callback(new Error('请输入密码'));
      } else if (value && (value.length < 6 || value.length > 50)) {
        callback(new Error('密码长度在 6 到 50 个字符'));
      } else {
        callback();
      }
    }, trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 系统授权对话框
const accessDialogVisible = ref(false);
const currentUser = ref(null);
const selectedSystems = ref([]);
const allSystems = ref([]);
const savingAccess = ref(false);

// 角色标签类型
const getRoleType = (role) => {
  const typeMap = {
    'admin': 'danger',
    'auditor': 'warning',
    'user': ''
  };
  return typeMap[role] || '';
};

// 角色标签文本
const getRoleLabel = (role) => {
  const labelMap = {
    'admin': '管理员',
    'auditor': '审计员',
    'user': '普通用户'
  };
  return labelMap[role] || role;
};

// 加载用户列表
const loadUserList = async () => {
  loading.value = true;
  try {
    const response = await getUserList();
    if (response.code === 200) {
      userList.value = response.data;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 创建用户
const handleCreate = () => {
  dialogTitle.value = '创建用户';
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑用户
const handleEdit = (row) => {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  userForm.value = {
    id: row.id,
    username: row.username,
    password: '',
    email: row.email || '',
    full_name: row.full_name || '',
    role: row.role,
    status: row.status
  };
  dialogVisible.value = true;
};

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await deleteUser(row.id);
    if (response.code === 200) {
      ElMessage.success('删除成功');
      loadUserList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error);
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  const valid = await userFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;

  try {
    // 准备提交数据（移除空密码）
    const data = { ...userForm.value };
    if (!data.password) {
      delete data.password;
    }

    let response;
    if (isEdit.value) {
      response = await updateUser(data.id, data);
    } else {
      response = await createUser(data);
    }

    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      dialogVisible.value = false;
      loadUserList();
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  userForm.value = {
    id: null,
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'user',
    status: 'active'
  };
  userFormRef.value?.clearValidate();
};

// 管理系统访问权限
const handleManageAccess = async (row) => {
  currentUser.value = row;
  accessDialogVisible.value = true;

  try {
    // 加载所有系统
    const systemsResponse = await systemAPI.getAll();
    if (systemsResponse.code === 200) {
      allSystems.value = systemsResponse.data;
    }

    // 加载用户已授权的系统
    const accessResponse = await getUserSystems(row.id);
    if (accessResponse.code === 200) {
      const data = accessResponse.data;
      if (data.has_all_access) {
        // 管理员或审计员，选中所有系统
        selectedSystems.value = allSystems.value.map(s => s.id);
      } else {
        // 普通用户，只选中已授权的系统
        selectedSystems.value = data.systems.map(s => s.id);
      }
    }
  } catch (error) {
    console.error('加载系统权限失败:', error);
    ElMessage.error('加载系统权限失败');
  }
};

// 保存系统访问权限
const handleSaveAccess = async () => {
  if (!currentUser.value || currentUser.value.role === 'admin' || currentUser.value.role === 'auditor') {
    return;
  }

  savingAccess.value = true;

  try {
    const response = await grantSystemAccess(currentUser.value.id, selectedSystems.value);
    if (response.code === 200) {
      ElMessage.success('授权成功');
      accessDialogVisible.value = false;
    } else {
      ElMessage.error(response.message || '授权失败');
    }
  } catch (error) {
    console.error('授权失败:', error);
    ElMessage.error(error.response?.data?.message || '授权失败');
  } finally {
    savingAccess.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadUserList();
});
</script>

<style scoped>
.user-manage-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.user-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-checkbox) {
  display: block;
  margin-bottom: 12px;
}
</style>
