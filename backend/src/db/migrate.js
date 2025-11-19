// 数据迁移脚本：从 JSON 文件迁移到 SQLite 数据库
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE_PATH = path.join(__dirname, '../../data/systems.json');
const DB_FILE_PATH = path.join(__dirname, '../../data/opshub.db');
const SCHEMA_FILE_PATH = path.join(__dirname, 'schema.sql');

/**
 * 将 ISO 8601 时间字符串转换为 Unix 时间戳（秒）
 * @param {string} isoString - ISO 8601 格式的时间字符串
 * @returns {number} Unix 时间戳（秒）
 */
function isoToUnixTimestamp(isoString) {
  if (!isoString) return null;
  return Math.floor(new Date(isoString).getTime() / 1000);
}

/**
 * 执行数据库迁移
 */
function migrate() {
  console.log('🚀 开始数据迁移...\n');

  // 1. 读取 JSON 数据
  console.log('📖 读取 JSON 数据文件...');
  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error('❌ 错误: 找不到 JSON 数据文件:', JSON_FILE_PATH);
    process.exit(1);
  }

  const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
  const systems = jsonData.systems || [];
  console.log(`✅ 成功读取 ${systems.length} 条系统记录\n`);

  // 2. 创建 SQLite 数据库
  console.log('💾 创建 SQLite 数据库...');
  const db = new Database(DB_FILE_PATH);
  console.log(`✅ 数据库文件创建于: ${DB_FILE_PATH}\n`);

  // 3. 执行表结构创建
  console.log('🔨 创建数据库表结构...');
  const schema = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ 数据库表结构创建完成\n');

  // 4. 迁移数据
  console.log('📦 迁移数据到 SQLite...');
  const insert = db.prepare(`
    INSERT INTO systems (
      id, name, url, icon, description, order_num, status,
      health_status, response_time, last_check_time, created_at, updated_at
    ) VALUES (
      @id, @name, @url, @icon, @description, @order_num, @status,
      @health_status, @response_time, @last_check_time, @created_at, @updated_at
    )
  `);

  const insertMany = db.transaction((systems) => {
    for (const system of systems) {
      // 转换时间字段为 Unix 时间戳（秒）
      const systemData = {
        id: system.id,
        name: system.name,
        url: system.url,
        icon: system.icon || 'Monitor',
        description: system.description || '',
        order_num: system.order_num || 0,
        status: system.status || 'active',
        health_status: system.health_status || 'unknown',
        response_time: system.response_time || null,
        last_check_time: isoToUnixTimestamp(system.last_check_time),
        created_at: isoToUnixTimestamp(system.created_at),
        updated_at: isoToUnixTimestamp(system.updated_at)
      };

      insert.run(systemData);
      console.log(`  ✓ 迁移: ${system.name} (ID: ${system.id})`);
    }
  });

  try {
    insertMany(systems);
    console.log(`\n✅ 成功迁移 ${systems.length} 条记录\n`);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    db.close();
    process.exit(1);
  }

  // 5. 验证数据
  console.log('🔍 验证迁移结果...');
  const count = db.prepare('SELECT COUNT(*) as count FROM systems').get();
  console.log(`✅ 数据库中共有 ${count.count} 条记录\n`);

  // 6. 备份原 JSON 文件
  console.log('💾 备份原 JSON 文件...');
  const backupPath = JSON_FILE_PATH + '.backup';
  fs.copyFileSync(JSON_FILE_PATH, backupPath);
  console.log(`✅ 备份文件保存于: ${backupPath}\n`);

  db.close();
  console.log('🎉 数据迁移完成！');
  console.log('\n提示: 原 JSON 文件已备份，可以在确认数据无误后删除备份文件。');
}

// 执行迁移
migrate();

export { migrate };
