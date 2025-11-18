<template>
  <div class="manage-container">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Setting /></el-icon>
        系统管理
      </h1>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加系统
      </el-button>
    </div>

    <el-table :data="systems" stripe v-loading="loading" class="systems-table">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="系统名称" width="180" />
      <el-table-column prop="url" label="访问地址" min-width="250" />
      <el-table-column prop="icon" label="图标" width="100">
        <template #default="{ row }">
          <el-icon :size="24">
            <component :is="getIconComponent(row.icon)" />
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="健康状态" width="140">
        <template #default="{ row }">
          <div class="health-status">
            <span class="health-dot" :class="'health-' + row.health_status">●</span>
            <span class="health-text" :class="'health-' + row.health_status">
              {{ getHealthText(row.health_status) }}
            </span>
            <span v-if="row.response_time" class="response-time">
              ({{ row.response_time }}ms)
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="order_num" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="系统名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入系统名称" />
        </el-form-item>
        <el-form-item label="访问地址" prop="url">
          <el-input v-model="formData.url" placeholder="请输入系统URL，如：http://localhost:8001" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="formData.icon" placeholder="请选择图标">
            <el-option
              v-for="icon in iconOptions"
              :key="icon"
              :label="icon"
              :value="icon"
            >
              <div class="icon-option">
                <el-icon><component :is="getIconComponent(icon)" /></el-icon>
                <span>{{ icon }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="系统描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入系统描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="order_num">
          <el-input-number v-model="formData.order_num" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Plus, Edit, Delete } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { systemAPI } from '../api/system'

const systems = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加系统')
const submitting = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const formData = reactive({
  name: '',
  url: '',
  icon: 'Monitor',
  description: '',
  order_num: 0,
  status: 'active'
})

const formRules = {
  name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入访问地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }]
}

// 常用图标列表
const iconOptions = [
  'Monitor', 'Connection', 'Share', 'VideoCamera',
  'Box', 'Cpu', 'DataAnalysis', 'Server',
  'Platform', 'Setting', 'Grid', 'Link'
]

const getIconComponent = (iconName) => {
  return ElementPlusIconsVue[iconName] || ElementPlusIconsVue.Monitor
}

const getHealthText = (healthStatus) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'unknown': '未知'
  }
  return statusMap[healthStatus] || '未知'
}

const fetchSystems = async () => {
  loading.value = true
  try {
    const response = await systemAPI.getAll()
    if (response.code === 200) {
      systems.value = response.data
    }
  } catch (error) {
    console.error('获取系统列表失败:', error)
    ElMessage.error('获取系统列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加系统'
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑系统'
  editingId.value = row.id
  Object.assign(formData, {
    name: row.name,
    url: row.url,
    icon: row.icon,
    description: row.description,
    order_num: row.order_num,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除系统"${row.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await systemAPI.delete(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await fetchSystems()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true

    let response
    if (editingId.value) {
      response = await systemAPI.update(editingId.value, formData)
    } else {
      response = await systemAPI.create(formData)
    }

    if (response.code === 200) {
      ElMessage.success(editingId.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      await fetchSystems()
    }
  } catch (error) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    url: '',
    icon: 'Monitor',
    description: '',
    order_num: 0,
    status: 'active'
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  fetchSystems()
})
</script>

<style scoped>
.manage-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #1890ff;
}

.systems-table {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.health-dot {
  font-size: 10px;
  line-height: 1;
}

.health-dot.health-online {
  color: #52c41a;
}

.health-dot.health-offline {
  color: #ff4d4f;
}

.health-dot.health-unknown {
  color: #d9d9d9;
}

.health-text.health-online {
  color: #52c41a;
}

.health-text.health-offline {
  color: #ff4d4f;
}

.health-text.health-unknown {
  color: #8c8c8c;
}

.response-time {
  color: #8c8c8c;
  font-size: 12px;
}
</style>
