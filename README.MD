# 企业证照管理系统

Django + React 实现的企业证照管理系统，覆盖证照录入、到期提醒、借出归还记录、证照到期统计。

## 功能

- 证照台账：证照名称、编号、类型、发证机关、归属部门、保管人、发证日期、到期日期、提醒天数。
- 到期提醒：后端按到期日期和提醒天数自动计算有效、即将到期、已到期状态。
- 借出归还：登记借用人、借用部门、用途、借出日期、预计归还日期，并支持一键登记归还。
- 到期统计：按状态、类型、近期到期、已到期证照汇总。

## 项目结构

```text
backend/
  license_manager/      Django 项目配置
  licenses/             证照业务模块
    models.py           数据模型
    serializers.py      API 序列化
    services.py         状态计算与统计服务
    views.py            REST API
    management/         演示数据命令
frontend/
  src/
    api/                接口客户端和选项配置
    components/         通用 UI 组件
    pages/              工作台、证照、借还、统计页面
docker-compose.yml      一键启动前后端
```

## Docker Compose 启动

```bash
docker compose up --build
```

启动后访问：

- 前端：http://127.0.0.1:19024
- 后端 API：http://127.0.0.1:18033/api/
- Django Admin：http://127.0.0.1:18033/admin/

容器启动时会自动执行数据库迁移并导入演示数据。SQLite 数据保存在 `backend_data` volume 中。

## 本地开发启动

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:18033
```

前端：

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 19024
```

如需修改 API 地址，设置 `frontend/.env`：

```text
VITE_API_BASE_URL=http://127.0.0.1:18033/api
```
