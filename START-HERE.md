# Hue Bakery · Complete VS Code Website

This folder contains the complete Hue Bakery website source code.

## Open it in Visual Studio Code

1. Extract the ZIP file.
2. Open Visual Studio Code.
3. Select **File > Open Folder...**.
4. Select the extracted `hue-bakery-complete-source` folder.
5. Open **Terminal > New Terminal** in Visual Studio Code.

中文说明：先解压 ZIP，然后在 VS Code 选择 **File > Open Folder...**，打开这个完整文件夹。不要只打开单独的 `app` 文件夹。

## Install and run locally

Run these commands in the VS Code terminal:

```powershell
npm install
npm run build
npm run start
```

Open the local URL shown in the terminal, normally:

`http://127.0.0.1:8787`

中文说明：`npm install` 安装依赖，`npm run build` 建立网站，`npm run start` 启动本机网站预览。

## Administrator login for local testing

The administrator password is not included in this source package. Set your own local secret when starting the Worker:

```powershell
npm run build
npm run start -- --var ADMIN_BOOTSTRAP_EMAIL:your-admin@example.com --var ADMIN_BOOTSTRAP_PASSWORD:ReplaceWithYourSecret --var ADMIN_EMAILS:your-admin@example.com
```

Then open `/login` and sign in. An administrator account is redirected to `/admin`.

中文说明：密码没有写入源码。请把 `your-admin@example.com` 和 `ReplaceWithYourSecret` 换成你自己的管理员资料。只有通过网站的 Login 页面登录并且角色是 `admin`，才可以进入 `/admin`。

## Main folders

- `app/` — Home, Menu, About, Account, Checkout, Payment and Admin pages.
- `app/api/` — Login, registration, customer data, orders, payment proof and administrator APIs.
- `app/components/` — Reusable customer, checkout, payment and admin interface components.
- `app/globals.css` — Customer website and administrator dashboard styling.
- `db/` — D1 database connection and table definitions.
- `drizzle/` — Database migration files.
- `lib/` — Authentication, validation, catalogue and security helpers.
- `public/` — Bakery image and favicon assets.
- `.openai/hosting.json` — Site hosting and D1/R2 binding configuration.

## Important security notes

- Never commit passwords, API keys, environment secrets or login tokens.
- The admin page only accepts the website's administrator session.
- Customer payment screenshots are stored privately in R2 and are only available through an administrator-protected endpoint.
- Customer accounts and administrator accounts use different roles in the database.

## Production website

The current published website is:

https://hue-bakery.chaujiaxuan4.chatgpt.site

