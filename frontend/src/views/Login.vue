<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <h1 class="logo-title">OpsHub</h1>
        <p class="logo-subtitle">运维统一门户</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 账号密码登录 -->
        <el-tab-pane label="账号登录" name="password">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                clearable
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="loginForm.remember">
                记住登录状态（7天）
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- SSO登录 -->
        <el-tab-pane label="SSO登录" name="sso">
          <div class="sso-container">
            <el-alert
              v-if="oauthProviders.length === 0"
              title="暂无可用的SSO提供商"
              type="info"
              center
              :closable="false"
            />

            <div v-else class="sso-buttons">
              <el-button
                v-for="provider in oauthProviders"
                :key="provider.id"
                size="large"
                class="sso-button"
                @click="handleSSOLogin(provider.name)"
              >
                <el-icon><Connection /></el-icon>
                {{ provider.display_name }}
              </el-button>
            </div>

            <el-divider v-if="oauthProviders.length > 0">
              <span class="divider-text">或使用账号密码登录</span>
            </el-divider>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p>默认管理员账户: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth.js';
import { getOAuthProviders } from '../api/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 当前激活的标签页
const activeTab = ref('password');

// 登录表单
const loginFormRef = ref(null);
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
};

// 加载状态
const loading = ref(false);

// OAuth提供商列表
const oauthProviders = ref([]);

// 处理账号密码登录
const handleLogin = async () => {
  // 验证表单
  const valid = await loginFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  try {
    const result = await authStore.login(
      {
        username: loginForm.username,
        password: loginForm.password
      },
      loginForm.remember
    );

    if (result.success) {
      ElMessage.success(result.message);

      // 跳转到之前的页面，或默认跳转到首页
      const redirect = route.query.redirect || '/';
      router.push(redirect);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 处理SSO登录
const handleSSOLogin = (providerName) => {
  // 重定向到OAuth授权端点
  window.location.href = `/api/auth/oauth/${providerName}`;
};

// 获取OAuth提供商列表
const fetchOAuthProviders = async () => {
  try {
    const response = await getOAuthProviders();
    if (response.code === 200) {
      oauthProviders.value = response.data || [];
    }
  } catch (error) {
    console.error('获取OAuth提供商列表失败:', error);
  }
};

// 处理OAuth回调
const handleOAuthCallback = () => {
  const token = route.query.token;
  const refreshToken = route.query.refresh_token;

  if (token && refreshToken) {
    // 保存令牌
    authStore.handleOAuthCallback(token, refreshToken, true);

    ElMessage.success('SSO登录成功');

    // 清除URL参数并跳转到首页
    router.replace('/');
  }
};

// 组件挂载时
onMounted(() => {
  // 如果已登录，直接跳转到首页
  if (authStore.isLoggedIn) {
    router.replace('/');
    return;
  }

  // 获取OAuth提供商列表
  fetchOAuthProviders();

  // 检查是否有OAuth回调参数
  handleOAuthCallback();
});
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 登录卡片 */
.login-card {
  position: relative;
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.logo-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 登录表单 */
.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  height: 45px;
}

.login-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* SSO容器 */
.sso-container {
  padding: 20px 0;
  min-height: 200px;
}

.sso-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sso-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  border: 2px solid #e0e0e0;
}

.sso-button:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.divider-text {
  color: #999;
  font-size: 13px;
}

/* 登录页脚 */
.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.login-footer p {
  margin: 5px 0;
}

/* 标签页样式调整 */
.login-tabs {
  margin-top: 20px;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
}

:deep(.el-tabs__active-bar) {
  background-color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    max-width: 400px;
    padding: 30px 20px;
  }

  .logo-title {
    font-size: 28px;
  }
}
</style>
