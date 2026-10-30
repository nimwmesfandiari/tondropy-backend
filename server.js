"use strict";

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

const app = express();

/*
=========================================================
CONFIG
=========================================================
*/

/*
  Telegram credentials
  این سه مقدار را در Vercel Environment Variables قرار بده:
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
  ADMIN_SECRET
*/

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "";

const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_CHAT_ID || "";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ||
  "TondropyAdmin2026";

/*
  Supabase
*/

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://vqddirelnxiklannquuu.supabase.co";

/*
  IMPORTANT:
  Secret Key فقط از Vercel خوانده می‌شود.
  هرگز sb_secret را داخل GitHub قرار نده.
*/

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  "";


/*
=========================================================
APP
=========================================================
*/

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

app.use(
  express.json({
    limit: "12mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "12mb"
  })
);


/*
=========================================================
HTTP CLIENT
=========================================================
*/

const http = axios.create({
  timeout: 15000
});


/*
=========================================================
HELPERS
=========================================================
*/

function fail(
  res,
  status,
  error,
  extra = {}
) {
  return res.status(status).json({
    success: false,
    error,
    ...extra
  });
}


/*
=========================================================
SUPABASE
=========================================================
*/

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}


async function supabase(
  method,
  table,
  data,
  params
) {
  if (!SUPABASE_KEY) {
    const error = new Error(
      "SUPABASE_SECRET_KEY is not configured on Vercel."
    );

    error.status = 500;

    throw error;
  }

  const response =
    await http.request({
      method,
      url:
        `${SUPABASE_URL}/rest/v1/${table}`,
      headers:
        getSupabaseHeaders(),
      data,
      params,
      validateStatus:
        () => true
    });

  if (response.status >= 400) {

    const error =
      new Error(
        response.data?.message ||
        response.data?.hint ||
        response.data?.error_description ||
        `Supabase HTTP ${response.status}`
      );

    error.status =
      response.status;

    error.details =
      response.data;

    throw error;
  }

  return response.data;
}


/*
=========================================================
TELEGRAM WEBAPP AUTH
=========================================================
*/

function verifyTelegram(
  initData
) {

  if (
    !initData ||
    !TELEGRAM_BOT_TOKEN
  ) {
    return {
      valid: false,
      reason:
        "Telegram configuration is missing."
    };
  }

  try {

    const params =
      new URLSearchParams(
        initData
      );

    const receivedHash =
      params.get("hash");

    if (!receivedHash) {
      return {
        valid: false,
        reason:
          "Telegram hash is missing."
      };
    }

    params.delete("hash");

    const dataCheckString =
      [...params.entries()]
        .sort(
          ([a], [b]) =>
            a.localeCompare(b)
        )
        .map(
          ([key, value]) =>
            `${key}=${value}`
        )
        .join("\n");

    const secretKey =
      crypto
        .createHmac(
          "sha256",
          "WebAppData"
        )
        .update(
          TELEGRAM_BOT_TOKEN
        )
        .digest();

    const calculatedHash =
      crypto
        .createHmac(
          "sha256",
          secretKey
        )
        .update(
          dataCheckString
        )
        .digest("hex");

    if (
      receivedHash.length !==
      calculatedHash.length
    ) {
      return {
        valid: false,
        reason:
          "Telegram signature is invalid."
      };
    }

    const valid =
      crypto.timingSafeEqual(
        Buffer.from(
          receivedHash
        ),
        Buffer.from(
          calculatedHash
        )
      );

    if (!valid) {
      return {
        valid: false,
        reason:
          "Telegram initData signature is invalid."
      };
    }

    const authDate =
      Number(
        params.get("auth_date") ||
        0
      );

    if (
      authDate &&
      Math.floor(
        Date.now() / 1000
      ) -
        authDate >
        86400
    ) {
      return {
        valid: false,
        reason:
          "Telegram initData has expired."
      };
    }

    let user = null;

    try {
      user =
        JSON.parse(
          params.get("user") ||
          "null"
        );
    } catch (_) {
      user = null;
    }

    return {
      valid: true,
      user
    };

  } catch (error) {

    return {
      valid: false,
      reason:
        error.message ||
        "Telegram validation failed."
    };
  }
}


/*
=========================================================
ADMIN AUTH
=========================================================
*/

function verifyAdmin(req) {

  const headerSecret =
    req.headers[
      "x-admin-secret"
    ] || "";

  const authorization =
    req.headers.authorization ||
    "";

  const bearerSecret =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization.slice(7)
      : "";

  const querySecret =
    req.query.secret || "";

  return (
    headerSecret ===
      ADMIN_SECRET ||
    bearerSecret ===
      ADMIN_SECRET ||
    querySecret ===
      ADMIN_SECRET
  );
}


/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      success: true,
      online: true,
      service:
        "TON Dropy Backend",
      version: "1.0.4",

      supabaseConfigured:
        Boolean(
          SUPABASE_KEY
        ),

      telegramConfigured:
        Boolean(
          TELEGRAM_BOT_TOKEN
        ),

      timestamp:
        new Date().toISOString()
    });

  }
);


/*
=========================================================
TEST SUPABASE
=========================================================
*/

app.get(
  "/api/test-db",
  async (req, res) => {

    try {

      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            limit: 5,
            order:
              "created_at.desc"
          }
        );

      res.json({
        success: true,
        message:
          "Supabase connection is working.",
        count:
          Array.isArray(users)
            ? users.length
            : 0,
        users
      });

    } catch (error) {

      res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        status:
          error.status || 500,
        details:
          error.details || null
      });

    }

  }
);


/*
=========================================================
TELEGRAM AUTH
=========================================================
*/

app.post(
  "/api/auth/telegram",
  async (req, res) => {

    const result =
      verifyTelegram(
        req.body?.initData
      );

    if (!result.valid) {
      return fail(
        res,
        401,
        result.reason
      );
    }

    const telegramUser =
      result.user;

    if (
      !telegramUser?.id
    ) {
      return fail(
        res,
        400,
        "Telegram user information is missing."
      );
    }

    const telegramId =
      String(
        telegramUser.id
      );

    const username =
      telegramUser.username ||
      "";

    const firstName =
      telegramUser.first_name ||
      "";

    const lastName =
      telegramUser.last_name ||
      "";

    try {

      const existing =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            telegram_id:
              `eq.${telegramId}`,
            limit: 1
          }
        );

      if (
        existing.length
      ) {

        const user =
          existing[0];

        const changed =
          user.username !==
            username ||
          user.first_name !==
            firstName ||
          user.last_name !==
            lastName;

        if (changed) {

          await supabase(
            "PATCH",
            "users",
            {
              username,
              first_name:
                firstName,
              last_name:
                lastName,
              updated_at:
                new Date().toISOString()
            },
            {
              telegram_id:
                `eq.${telegramId}`
            }
          );

          user.username =
            username;

          user.first_name =
            firstName;

          user.last_name =
            lastName;
        }

        return res.json({
          success: true,
          existing: true,

          user_id:
            user.id,

          telegram_id:
            telegramId,

          username:
            user.username || "",

          account_status:
            user.account_status ||
            "inactive",

          user
        });
      }

      const created =
        await supabase(
          "POST",
          "users",
          {
            telegram_id:
              telegramId,

            username,

            first_name:
              firstName,

            last_name:
              lastName,

            account_status:
              "inactive"
          }
        );

      const user =
        created[0];

      return res.json({
        success: true,
        existing: false,

        user_id:
          user?.id || null,

        telegram_id:
          telegramId,

        username,

        account_status:
          user?.account_status ||
          "inactive",

        user
      });

    } catch (error) {

      return res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        details:
          error.details || null
      });

    }

  }
);


/*
=========================================================
UPLOAD RECEIPT
=========================================================
*/

app.post(
  "/api/upload-receipt",
  async (req, res) => {

    const telegramId =
      String(
        req.body?.telegramId ||
        ""
      ).trim();

    const username =
      String(
        req.body?.username ||
        ""
      ).trim();

    const amount =
      Number(
        req.body?.amount ||
        0
      );

    /*
      پشتیبانی از هر سه نام
      برای سازگاری با نسخه‌های قبلی
    */

    const imageData =
      req.body?.imageData ||
      req.body?.imageBase64 ||
      req.body?.receipt ||
      "";

    if (!telegramId) {
      return fail(
        res,
        400,
        "telegramId is required."
      );
    }

    if (
      !/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(
        imageData
      )
    ) {
      return fail(
        res,
        400,
        "Receipt must be a valid image."
      );
    }

    if (
      imageData.length >
      10 * 1024 * 1024
    ) {
      return fail(
        res,
        413,
        "Receipt image is too large."
      );
    }

    try {

      const users =
        await supabase(
          "GET",
          "users",
          undefined,
          {
            select: "*",
            telegram_id:
              `eq.${telegramId}`,
            limit: 1
          }
        );

      if (!users.length) {
        return fail(
          res,
          404,
          "Telegram user was not found."
        );
      }

      const user =
        users[0];

      if (
        user.account_status ===
        "active"
      ) {

        return res.json({
          success: true,
          alreadyActive: true,
          message:
            "Your account is already active.",
          user
        });
      }

      const pending =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select:
              "id,status,created_at",

            telegram_id:
              `eq.${telegramId}`,

            status:
              "eq.pending",

            limit: 1
          }
        );

      if (
        pending.length
      ) {

        return res.status(
          409
        ).json({
          success: false,
          pending: true,

          message:
            "A receipt is already waiting for review.",

          receipt:
            pending[0]
        });

      }

      const inserted =
        await supabase(
          "POST",
          "receipts",
          {
            user_id:
              user.id,

            telegram_id:
              telegramId,

            username:
              username ||
              user.username ||
              "",

            amount:
              amount || null,

            image_data:
              imageData,

            status:
              "pending"
          }
        );

      const receipt =
        inserted[0];

      await supabase(
        "PATCH",
        "users",
        {
          account_status:
            "pending",

          updated_at:
            new Date().toISOString()
        },
        {
          telegram_id:
            `eq.${telegramId}`
        }
      );

      /*
        ارسال رسید به Telegram
      */

      if (
        TELEGRAM_BOT_TOKEN &&
        TELEGRAM_CHAT_ID
      ) {

        try {

          await sendTelegramReceipt(
            telegramId,
            username ||
              user.username ||
              "",
            amount,
            imageData,
            receipt?.id
          );

        } catch (error) {

          console.error(
            "Telegram notification failed:",
            error.message
          );

        }

      }

      return res.json({
        success: true,

        message:
          "Receipt submitted successfully.",

        receipt,

        account_status:
          "pending"
      });

    } catch (error) {

      return res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        details:
          error.details || null
      });

    }

  }
);


/*
=========================================================
SEND RECEIPT TO TELEGRAM
=========================================================
*/

async function sendTelegramReceipt(
  telegramId,
  username,
  amount,
  imageData,
  receiptId
) {

  const match =
    imageData.match(
      /^data:(image\/[^;]+);base64,(.+)$/i
    );

  if (!match) {
    throw new Error(
      "Invalid receipt image."
    );
  }

  const mime =
    match[1];

  const buffer =
    Buffer.from(
      match[2],
      "base64"
    );

  const extension =
    mime.includes("png")
      ? "png"
      : mime.includes("webp")
      ? "webp"
      : "jpg";

  const form =
    new FormData();

  form.append(
    "chat_id",
    TELEGRAM_CHAT_ID
  );

  form.append(
    "caption",

`TON Dropy

🧾 رسید جدید

👤 Telegram ID: ${telegramId}
🔹 Username: ${
  username
    ? "@" + username
    : "-"
}
💰 مبلغ: ${
  amount
    ? Number(
        amount
      ).toLocaleString(
        "fa-IR"
      )
    : "-"
}
🆔 Receipt ID: ${
  receiptId || "-"
}

⏳ وضعیت: در انتظار بررسی`
  );

  form.append(
    "photo",
    new Blob(
      [buffer],
      {
        type: mime
      }
    ),
    `receipt-${Date.now()}.${extension}`
  );

  const response =
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method:
          "POST",
        body:
          form
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.description ||
        "Telegram API error."
    );
  }
}


/*
=========================================================
ADMIN RECEIPTS
=========================================================
*/

app.get(
  "/api/admin/receipts-v2",
  async (req, res) => {

    if (!verifyAdmin(req)) {
      return fail(
        res,
        401,
        "Unauthorized."
      );
    }

    try {

      const receipts =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",
            order:
              "created_at.desc"
          }
        );

      return res.json({
        success: true,
        receipts
      });

    } catch (error) {

      return res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        details:
          error.details || null
      });

    }

  }
);


/*
=========================================================
ADMIN REVIEW
=========================================================
*/

app.post(
  "/api/admin/review",
  async (req, res) => {

    if (!verifyAdmin(req)) {
      return fail(
        res,
        401,
        "Unauthorized."
      );
    }

    const receiptId =
      String(
        req.body?.receiptId ||
        ""
      );

    const status =
      req.body?.status;

    if (!receiptId) {
      return fail(
        res,
        400,
        "receiptId is required."
      );
    }

    if (
      ![
        "approved",
        "rejected"
      ].includes(status)
    ) {
      return fail(
        res,
        400,
        "status must be approved or rejected."
      );
    }

    try {

      /*
        رسید واقعی را از DB می‌خوانیم.
        user_id از مرورگر قبول نمی‌شود.
      */

      const rows =
        await supabase(
          "GET",
          "receipts",
          undefined,
          {
            select: "*",
            id:
              `eq.${receiptId}`,
            limit: 1
          }
        );

      if (!rows.length) {
        return fail(
          res,
          404,
          "Receipt not found."
        );
      }

      const receipt =
        rows[0];

      if (
        receipt.status !==
        "pending"
      ) {

        return res.status(
          409
        ).json({
          success: false,

          error:
            "This receipt has already been reviewed.",

          current_status:
            receipt.status
        });

      }

      const reviewedAt =
        new Date().toISOString();

      const updated =
        await supabase(
          "PATCH",
          "receipts",
          {
            status,
            reviewed_at:
              reviewedAt
          },
          {
            id:
              `eq.${receiptId}`,

            status:
              "eq.pending"
          }
        );

      if (!updated.length) {
        return res.status(
          409
        ).json({
          success: false,
          error:
            "Receipt was already reviewed."
        });
      }

      try {

        const userFilter =
          receipt.user_id
            ? {
                id:
                  `eq.${receipt.user_id}`
              }
            : {
                telegram_id:
                  `eq.${receipt.telegram_id}`
              };

        await supabase(
          "PATCH",
          "users",
          {
            account_status:
              status ===
              "approved"
                ? "active"
                : "inactive",

            updated_at:
              reviewedAt
          },
          userFilter
        );

      } catch (error) {

        /*
          Rollback receipt
          اگر تغییر کاربر شکست خورد
        */

        try {

          await supabase(
            "PATCH",
            "receipts",
            {
              status:
                "pending",

              reviewed_at:
                null
            },
            {
              id:
                `eq.${receiptId}`,

              status:
                `eq.${status}`
            }
          );

        } catch (_) {}

        throw error;
      }

      return res.json({
        success: true,

        message:
          status ===
          "approved"
            ? "Receipt approved and user activated."
            : "Receipt rejected.",

        receipt:
          updated[0]
      });

    } catch (error) {

      return res.status(
        error.status || 500
      ).json({
        success: false,
        error:
          error.message,
        details:
          error.details || null
      });

    }

  }
);


/*
=========================================================
PAGES
=========================================================
*/

app.get(
  "/admin",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "admin.html"
      )
    );

  }
);


app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    ),
    {
      index:
        "index.html"
    }
  )
);


/*
=========================================================
404
=========================================================
*/

app.use(
  (req, res) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {

      return fail(
        res,
        404,
        "API route not found."
      );

    }

    return res
      .status(404)
      .send(
        "TON Dropy - Page not found."
      );

  }
);


/*
=========================================================
VERCEL
=========================================================
*/

module.exports = app;
