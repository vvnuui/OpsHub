<template>
  <div class="oauth-config-container">
    <div class="page-header">
      <h1>OAuth提供商配置</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        添加提供商
      </el-button>
    </div>

    <!-- OAuth提供商列表 -->
    <el-table
      :data="providerList"
      v-loading="loading"
      class="provider-table"
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" width="150" />
      <el-table-column prop="display_name" label="显示名称" width="150" />
      <el-table-column prop="client_id" label="Client ID" min-width="200">
        <template #default="{ row }">
          <el-text truncated>{{ row.client_id }}</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="authorize_url" label="授权URL" min-width="250">
        <template #default="{ row }">
          <el-text truncated>{{ row.authorize_url }}</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '已启用' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            :type="row.enabled ? 'warning' : 'success'"
            @click="handleToggle(row)"
          >
            {{ row.enabled ? '禁用' : '启用' }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="例如: google, github"
            :disabled="isEdit"
          />
          <div class="form-tip">唯一标识，创建后不可修改</div>
        </el-form-item>
        <el-form-item label="显示名称" prop="display_name">
          <el-input
            v-model="formData.display_name"
            placeholder="例如: Google, GitHub"
          />
        </el-form-item>
        <el-form-item label="Client ID" prop="client_id">
          <el-input
            v-model="formData.client_id"
            placeholder="OAuth应用的Client ID"
          />
        </el-form-item>
        <el-form-item label="Client Secret" prop="client_secret">
          <el-input
            v-model="formData.client_secret"
            type="password"
            show-password
            placeholder="OAuth应用的Client Secret"
          />
        </el-form-item>
        <el-form-item label="授权URL" prop="authorize_url">
          <el-input
            v-model="formData.authorize_url"
            placeholder="https://accounts.google.com/o/oauth2/v2/auth"
          />
        </el-form-item>
        <el-form-item label="令牌URL" prop="token_url">
          <el-input
            v-model="formData.token_url"
            placeholder="https://oauth2.googleapis.com/token"
          />
        </el-form-item>
        <el-form-item label="用户信息URL" prop="user_info_url">
          <el-input
            v-model="formData.user_info_url"
            placeholder="https://www.googleapis.com/oauth2/v2/userinfo"
          />
        </el-form-item>
        <el-form-item label="Scope" prop="scope">
          <el-input
            v-model="formData.scope"
            placeholder="openid profile email"
          />
          <div class="form-tip">空格分隔的权限范围</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  getOAuthProviders,
  createOAuthProvider,
  updateOAuthProvider,
  deleteOAuthProvider,
  toggleOAuthProvider
} from '../api/oauthProvider.js';

// OAuth提供商列表
const providerList = ref([]);
const loading = ref(false);

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentProviderId = ref(null);
const submitting = ref(false);

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑OAuth提供商' : '添加OAuth提供商';
});

// 表单数据
const formRef = ref(null);
const formData = ref({
  name: '',
  display_name: '',
  client_id: '',
  client_secret: '',
  authorize_url: '',
  token_url: '',
  user_info_url: '',
  scope: 'openid profile email'
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]+$/, message: '名称只能包含小写字母、数字、下划线和横线', trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' }
  ],
  client_id: [
    { required: true, message: '请输入Client ID', trigger: 'blur' }
  ],
  client_secret: [
    { required: true, message: '请输入Client Secret', trigger: 'blur' }
  ],
  authorize_url: [
    { required: true, message: '请输入授权URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  token_url: [
    { required: true, message: '请输入令牌URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  user_info_url: [
    { required: true, message: '请输入用户信息URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ]
};

// 加载OAuth提供商列表
const loadProviders = async () => {
  loading.value = true;
  try {
    const response = await getOAuthProviders();
    if (response.code === 200) {
      providerList.value = response.data;
    }
  } catch (error) {
    console.error('加载OAuth提供商列表失败:', error);
    ElMessage.error(error.response?.data?.message || '加载OAuth提供商列表失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    display_name: '',
    client_id: '',
    client_secret: '',
    authorize_url: '',
    token_url: '',
    user_info_url: '',
    scope: 'openid profile email'
  };
  formRef.value?.clearValidate();
};

// 打开创建对话框
const handleCreate = () => {
  resetForm();
  isEdit.value = false;
  currentProviderId.value = null;
  dialogVisible.value = true;
};

// 打开编辑对话框
const handleEdit = (row) => {
  resetForm();
  isEdit.value = true;
  currentProviderId.value = row.id;

  // 填充表单数据
  formData.value = {
    name: row.name,
    display_name: row.display_name,
    client_id: row.client_id,
    client_secret: row.client_secret,
    authorize_url: row.authorize_url,
    token_url: row.token_url,
    user_info_url: row.user_info_url,
    scope: row.scope || 'openid profile email'
  };

  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    await formRef.value.validate();

    submitting.value = true;

    if (isEdit.value) {
      // 编辑模式 - 只提交已修改的字段（除了name）
      const { name, ...updateData } = formData.value;
      const response = await updateOAuthProvider(currentProviderId.value, updateData);

      if (response.code === 200) {
        ElMessage.success('OAuth提供商更新成功');
        dialogVisible.value = false;
        loadProviders();
      }
    } else {
      // 创建模式
      const response = await createOAuthProvider(formData.value);

      if (response.code === 200) {
        ElMessage.success('OAuth提供商创建成功');
        dialogVisible.value = false;
        loadProviders();
      }
    }
  } catch (error) {
    if (error !== false) { // 排除表单验证失败的情况
      console.error('提交失败:', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  } finally {
    submitting.value = false;
  }
};

// 切换启用状态
const handleToggle = async (row) => {
  try {
    const action = row.enabled ? '禁用' : '启用';
    await ElMessageBox.confirm(
      `确定要${action}此OAuth提供商吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await toggleOAuthProvider(row.id);

    if (response.code === 200) {
      ElMessage.success(response.message);
      loadProviders();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换状态失败:', error);
      ElMessage.error(error.response?.data?.message || '切换状态失败');
    }
  }
};

// 删除OAuth提供商
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除OAuth提供商"${row.display_name}"吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    const response = await deleteOAuthProvider(row.id);

    if (response.code === 200) {
      ElMessage.success('OAuth提供商删除成功');
      loadProviders();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadProviders();
});
</script>

<style scoped>
.oauth-config-container {
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

.provider-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-tip {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
}
</style>
