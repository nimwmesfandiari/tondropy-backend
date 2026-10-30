const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

const app = express();

// ======================================================
// CONFIG
// ======================================================

const PORT = process.env.PORT || 3000;

// Telegram
const TELEGRAM_BOT_TOKEN =
  "8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk";

const TELEGRAM_CHAT_ID =
  "5972276401";

// Admin
const ADMIN_SECRET =
  "TondropyAdmin2026";

// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://vqddirelnxiklannquuu.supabase.co";

// IMPORTANT:
// For Vercel/backend use:
// SUPABASE_SECRET_KEY=sb_secret_...
//
// SUPABASE_KEY is also supported for compatibility.

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

function supabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_KEY
  );
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

// ======================================================
// APP
// ======================================================

app.disable("x-powered-by");

app.use(cors());

app.use(
  express.json({
    limit: "15mb"
  })
);

// ======================================================
// STATIC FILES
// ======================================================

const publicDir =
  path.join(__dirname, "public");

// Main frontend
app.use(
  express.static(publicDir, {
    index: "index.html",
    extensions: ["html"]
  })
);

// ======================================================
// HELPERS
// ======================================================

function errorInfo(error) {
  return {
    message:
      error?.message ||
      "Unknown error",

    status:
      error?.response?.status ||
      null,

    details:
      error?.response?.data ||
      null
  };
}

function jsonError(
  res,
  status,
  message,
  extra = {}
) {
  return res.status(status).json({
    success: false,
    message,
    ...extra
  });
}

function getAdminSecret(req) {
  const authorization =
    req.headers.authorization;

  let bearer = "";

  if (
    typeof authorization === "string" &&
    authorization.startsWith("Bearer ")
  ) {
    bearer =
      authorization.substring(7);
  }

  return (
    req.headers["x-admin-secret"] ||
    req.headers["x-admin-key"] ||
    req.query?.secret ||
    req.body?.secret ||
    bearer ||
    ""
  );
}

function isAdmin(req) {
  return (
    String(getAdminSecret(req)) ===
    String(ADMIN_SECRET)
  );
}

function requireSupabase(res) {
  if (!supabaseConfigured()) {
    return jsonError(
      res,
      500,
      "کلید Supabase در سرور تنظیم نشده است.",
      {
        code: "SUPABASE_KEY_MISSING"
      }
    );
  }

  return null;
}

function supabaseUrl(pathname) {
  return (
    SUPABASE_URL +
    "/rest/v1/" +
    pathname
  );
}

// ======================================================
// TELEGRAM WEB APP VERIFICATION
// ======================================================

function verifyTelegramWebAppData(initData) {
  try {
    if (!initData) {
      return false;
    }

    const params =
      new URLSearchParams(initData);

    const receivedHash =
      params.get("hash");

    if (!receivedHash) {
      return false;
    }

    params.delete("hash");

    const dataCheckString =
      Array.from(params.entries())
        .sort((a, b) =>
          a[0].localeCompare(b[0])
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

    const received =
      Buffer.from(
        receivedHash,
        "hex"
      );

    const calculated =
      Buffer.from(
        calculatedHash,
        "hex"
      );

    if (
      received.length !==
      calculated.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      received,
      calculated
    );

  } catch (error) {

    console.error(
      "TELEGRAM VERIFY ERROR:",
      errorInfo(error)
    );

    return false;
  }
}

// ======================================================
// TELEGRAM API
// ======================================================

async function sendTelegramMessage(
  text
) {
  try {

    const response =
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id:
            TELEGRAM_CHAT_ID,

          text
        },
        {
          timeout: 15000
        }
      );

    return response.data;

  } catch (error) {

    console.error(
      "TELEGRAM MESSAGE ERROR:",
      errorInfo(error)
    );

    return null;
  }
}

// ======================================================
// DATABASE HELPERS
// ======================================================

async function getUserByTelegramId(
  telegramId
) {

  const response =
    await axios.get(
      supabaseUrl(
        "users?telegram_id=eq." +
        encodeURIComponent(
          telegramId
        ) +
        "&select=*"
      ),
      {
        headers:
          supabaseHeaders(),
        timeout: 10000
      }
    );

  return (
    response.data?.[0] ||
    null
  );
}

async function getUserById(
  userId
) {

  const response =
    await axios.get(
      supabaseUrl(
        "users?id=eq." +
        encodeURIComponent(
          userId
        ) +
        "&select=*"
      ),
      {
        headers:
          supabaseHeaders(),
        timeout: 10000
      }
    );

  return (
    response.data?.[0] ||
    null
  );
}

async function getReceiptById(
  receiptId
) {

  const response =
    await axios.get(
      supabaseUrl(
        "receipts?id=eq." +
        encodeURIComponent(
          receiptId
        ) +
        "&select=*"
      ),
      {
        headers:
          supabaseHeaders(),
        timeout: 10000
      }
    );

  return (
    response.data?.[0] ||
    null
  );
}

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  function(req, res) {

    return res.json({
      success: true,
      service:
        "TON Dropy backend",
      status:
        "online",
      supabase:
        supabaseConfigured()
          ? "configured"
          : "missing",
      time:
        new Date().toISOString()
    });

  }
);

// ======================================================
// TEST DATABASE
// ======================================================

app.get(
  "/api/test-db",
  async function(req, res) {

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    try {

      const response =
        await axios.get(
          supabaseUrl(
            "users?select=id,telegram_id,username&limit=1"
          ),
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      return res.json({
        success: true,
        message:
          "اتصال به دیتابیس موفق بود.",
        data:
          response.data
      });

    } catch (error) {

      console.error(
        "TEST DB ERROR:",
        errorInfo(error)
      );

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,
        error:
          error.message,
        status:
          error.response?.status ||
          null,
        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// TELEGRAM AUTH
// ======================================================

app.post(
  "/api/auth/telegram",
  async function(req, res) {

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    try {

      const initData =
        req.body?.initData;

      if (!initData) {

        return jsonError(
          res,
          400,
          "اطلاعات Telegram ارسال نشده است."
        );
      }

      if (
        !verifyTelegramWebAppData(
          initData
        )
      ) {

        return jsonError(
          res,
          401,
          "اطلاعات Telegram نامعتبر است."
        );
      }

      const params =
        new URLSearchParams(
          initData
        );

      const userString =
        params.get("user");

      if (!userString) {

        return jsonError(
          res,
          400,
          "اطلاعات کاربر Telegram وجود ندارد."
        );
      }

      let tgUser;

      try {

        tgUser =
          JSON.parse(
            userString
          );

      } catch {

        return jsonError(
          res,
          400,
          "اطلاعات کاربر Telegram قابل خواندن نیست."
        );
      }

      if (!tgUser?.id) {

        return jsonError(
          res,
          400,
          "Telegram ID معتبر نیست."
        );
      }

      let user =
        await getUserByTelegramId(
          tgUser.id
        );

      // ------------------------------------------------
      // CREATE USER
      // ------------------------------------------------

      if (!user) {

        const insertResponse =
          await axios.post(
            supabaseUrl("users"),
            {
              telegram_id:
                tgUser.id,

              first_name:
                tgUser.first_name ||
                "",

              last_name:
                tgUser.last_name ||
                "",

              username:
                tgUser.username ||
                `user_${tgUser.id}`,

              account_status:
                "inactive"
            },
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        user =
          insertResponse.data?.[0] ||
          null;

        if (!user) {

          throw new Error(
            "کاربر در Supabase ساخته نشد."
          );
        }

      } else {

        // ----------------------------------------------
        // UPDATE TELEGRAM INFORMATION
        // ----------------------------------------------

        const updateData = {
          first_name:
            tgUser.first_name ||
            user.first_name ||
            "",

          last_name:
            tgUser.last_name ||
            user.last_name ||
            "",

          username:
            tgUser.username ||
            user.username ||
            `user_${tgUser.id}`
        };

        await axios.patch(
          supabaseUrl(
            "users?id=eq." +
            encodeURIComponent(
              user.id
            )
          ),
          updateData,
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

        user = {
          ...user,
          ...updateData
        };
      }

      let accountStatus =
        user.account_status ||
        user.status ||
        "inactive";

      // ------------------------------------------------
      // CHECK PENDING RECEIPT
      // ------------------------------------------------

      let pendingReceipt = null;

      try {

        const pendingResponse =
          await axios.get(
            supabaseUrl(
              "receipts?user_id=eq." +
              encodeURIComponent(
                user.id
              ) +
              "&status=eq.pending" +
              "&select=id,amount,method,status,created_at" +
              "&limit=1"
            ),
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        pendingReceipt =
          pendingResponse.data?.[0] ||
          null;

      } catch (error) {

        console.error(
          "PENDING RECEIPT CHECK ERROR:",
          errorInfo(error)
        );
      }

      if (
        pendingReceipt &&
        accountStatus !== "blocked"
      ) {
        accountStatus =
          "pending";
      }

      return res.json({
        success: true,

        user: {
          id:
            user.id,

          telegram_id:
            tgUser.id,

          name:
            tgUser.first_name ||
            user.first_name ||
            "کاربر",

          username:
            tgUser.username ||
            user.username ||
            `user_${tgUser.id}`,

          status:
            accountStatus,

          account_status:
            accountStatus,

          pending_receipt:
            pendingReceipt
        }
      });

    } catch (error) {

      console.error(
        "AUTH ERROR:",
        errorInfo(error)
      );

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,

        message:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// UPLOAD RECEIPT
// ======================================================

app.post(
  "/api/upload-receipt",
  async function(req, res) {

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    try {

      const {
        telegramId,
        userId,
        username,
        amount,
        method,
        imageBase64
      } = req.body || {};

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (
        !imageBase64 ||
        !amount ||
        !method
      ) {

        return jsonError(
          res,
          400,
          "اطلاعات رسید ناقص است."
        );
      }

      if (
        ![
          "full",
          "installment"
        ].includes(method)
      ) {

        return jsonError(
          res,
          400,
          "روش پرداخت نامعتبر است."
        );
      }

      const numericAmount =
        Number.parseInt(
          String(amount),
          10
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        return jsonError(
          res,
          400,
          "مبلغ نامعتبر است."
        );
      }

      if (
        imageBase64.length >
        7000000
      ) {

        return jsonError(
          res,
          400,
          "حجم عکس رسید زیاد است."
        );
      }

      if (
        !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(
          imageBase64
        )
      ) {

        return jsonError(
          res,
          400,
          "فرمت تصویر رسید نامعتبر است."
        );
      }

      // ------------------------------------------------
      // FIND USER
      // ------------------------------------------------

      let user = null;

      // Most reliable
      if (telegramId) {

        user =
          await getUserByTelegramId(
            telegramId
          );
      }

      // Fallback
      if (!user && userId) {

        user =
          await getUserById(
            userId
          );
      }

      // Backward compatibility only
      if (!user && username) {

        const response =
          await axios.get(
            supabaseUrl(
              "users?username=eq." +
              encodeURIComponent(
                username
              ) +
              "&select=*"
            ),
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        user =
          response.data?.[0] ||
          null;
      }

      if (!user) {

        return jsonError(
          res,
          404,
          "کاربر در دیتابیس پیدا نشد."
        );
      }

      // ------------------------------------------------
      // BLOCKED
      // ------------------------------------------------

      if (
        user.account_status ===
        "blocked"
      ) {

        return jsonError(
          res,
          403,
          "حساب شما مسدود شده است."
        );
      }

      // ------------------------------------------------
      // ACTIVE USER
      // ------------------------------------------------

      if (
        user.account_status ===
        "active"
      ) {

        return jsonError(
          res,
          409,
          "حساب شما قبلاً فعال شده است."
        );
      }

      // ------------------------------------------------
      // PREVENT DUPLICATE PENDING
      // ------------------------------------------------

      const duplicateResponse =
        await axios.get(
          supabaseUrl(
            "receipts?user_id=eq." +
            encodeURIComponent(
              user.id
            ) +
            "&status=eq.pending" +
            "&select=id,amount,method,created_at" +
            "&limit=1"
          ),
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      if (
        Array.isArray(
          duplicateResponse.data
        ) &&
        duplicateResponse.data.length
      ) {

        return jsonError(
          res,
          409,
          "برای این حساب یک رسید در انتظار بررسی وجود دارد.",
          {
            receipt:
              duplicateResponse.data[0]
          }
        );
      }

      // ------------------------------------------------
      // CREATE RECEIPT
      // ------------------------------------------------

      const receiptResponse =
        await axios.post(
          supabaseUrl("receipts"),
          {
            user_id:
              user.id,

            amount:
              numericAmount,

            method:
              method,

            status:
              "pending"
          },
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      const receipt =
        receiptResponse.data?.[0] ||
        null;

      if (!receipt) {

        throw new Error(
          "رسید در Supabase ثبت نشد."
        );
      }

      // ------------------------------------------------
      // USER -> PENDING
      // ------------------------------------------------

      await axios.patch(
        supabaseUrl(
          "users?id=eq." +
          encodeURIComponent(
            user.id
          )
        ),
        {
          account_status:
            "pending"
        },
        {
          headers:
            supabaseHeaders(),
          timeout: 10000
        }
      );

      // ------------------------------------------------
      // TELEGRAM PHOTO
      // ------------------------------------------------

      const base64Data =
        imageBase64.replace(
          /^data:image\/[^;]+;base64,/,
          ""
        );

      const buffer =
        Buffer.from(
          base64Data,
          "base64"
        );

      const FormDataClass =
        globalThis.FormData;

      const BlobClass =
        globalThis.Blob;

      if (
        !FormDataClass ||
        !BlobClass
      ) {

        throw new Error(
          "Node.js 20 برای ارسال تصویر لازم است."
        );
      }

      const formData =
        new FormDataClass();

      formData.append(
        "chat_id",
        TELEGRAM_CHAT_ID
      );

      const caption =
        "🧾 رسید جدید\n" +
        "━━━━━━━━━━━━━━\n" +
        `👤 کاربر: @${user.username || username || "user"}\n` +
        `🆔 Telegram ID: ${user.telegram_id || telegramId || "-"}\n` +
        `💰 مبلغ: ${numericAmount.toLocaleString("fa-IR")} تومان\n` +
        `💳 روش: ${method === "full" ? "پرداخت کامل" : "اقساطی"}\n` +
        `🆔 Receipt ID: ${receipt.id}`;

      formData.append(
        "caption",
        caption
      );

      formData.append(
        "photo",
        new BlobClass(
          [buffer],
          {
            type:
              "image/jpeg"
          }
        ),
        "receipt.jpg"
      );

      const telegramResponse =
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: formData
          }
        );

      const telegramData =
        await telegramResponse.json();

      // ------------------------------------------------
      // TELEGRAM FAILURE
      // ------------------------------------------------

      if (
        !telegramResponse.ok ||
        !telegramData.ok
      ) {

        console.error(
          "TELEGRAM SEND PHOTO ERROR:",
          telegramData
        );

        return res.status(502).json({
          success: false,

          message:
            "رسید در دیتابیس ثبت شد، اما ارسال آن به Telegram ناموفق بود.",

          receipt_id:
            receipt.id,

          telegram_error:
            telegramData.description ||
            "Telegram error"
        });
      }

      return res.json({
        success: true,

        message:
          "رسید با موفقیت ثبت و برای مدیریت ارسال شد.",

        receipt_id:
          receipt.id
      });

    } catch (error) {

      console.error(
        "UPLOAD RECEIPT ERROR:",
        errorInfo(error)
      );

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,

        message:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// ADMIN CHECK
// ======================================================

app.get(
  "/api/admin/check",
  function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        authenticated:
          false,
        error:
          "ADMIN_UNAUTHORIZED"
      });
    }

    return res.json({
      success: true,
      authenticated:
        true,
      message:
        "Admin authentication successful"
    });
  }
);

// ======================================================
// ADMIN RECEIPTS
// ======================================================

app.get(
  "/api/admin/receipts-v2",
  async function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        error:
          "ADMIN_UNAUTHORIZED",
        message:
          "کلید مدیریت نامعتبر است."
      });
    }

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    try {

      const receiptsResponse =
        await axios.get(
          supabaseUrl(
            "receipts" +
            "?status=eq.pending" +
            "&select=*" +
            "&order=created_at.desc"
          ),
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      const receipts =
        Array.isArray(
          receiptsResponse.data
        )
          ? receiptsResponse.data
          : [];

      if (!receipts.length) {
        return res.json([]);
      }

      const userIds =
        [
          ...new Set(
            receipts
              .map(
                item =>
                  item.user_id
              )
              .filter(Boolean)
          )
        ];

      let users = [];

      if (userIds.length) {

        const orQuery =
          userIds
            .map(
              id =>
                `id.eq.${encodeURIComponent(id)}`
            )
            .join(",");

        const usersResponse =
          await axios.get(
            supabaseUrl(
              "users" +
              "?select=id,telegram_id,username,first_name,last_name,account_status" +
              `&or=(${orQuery})`
            ),
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        users =
          Array.isArray(
            usersResponse.data
          )
            ? usersResponse.data
            : [];
      }

      const result =
        receipts.map(
          receipt => {

            const user =
              users.find(
                item =>
                  String(item.id) ===
                  String(
                    receipt.user_id
                  )
              );

            return {
              ...receipt,

              username:
                user?.username ||
                "ناشناس",

              telegram_id:
                user?.telegram_id ||
                null,

              first_name:
                user?.first_name ||
                "",

              last_name:
                user?.last_name ||
                "",

              account_status:
                user?.account_status ||
                "inactive",

              users:
                user
                  ? {
                      id:
                        user.id,

                      username:
                        user.username,

                      telegram_id:
                        user.telegram_id,

                      first_name:
                        user.first_name,

                      last_name:
                        user.last_name,

                      account_status:
                        user.account_status
                    }
                  : null
            };
          }
        );

      return res.json(result);

    } catch (error) {

      console.error(
        "ADMIN RECEIPTS ERROR:",
        errorInfo(error)
      );

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,

        error:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// ADMIN USERS
// ======================================================

app.get(
  "/api/admin/users",
  async function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        error:
          "ADMIN_UNAUTHORIZED"
      });
    }

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    try {

      const response =
        await axios.get(
          supabaseUrl(
            "users?select=*&order=created_at.desc"
          ),
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      return res.json({
        success: true,

        users:
          Array.isArray(
            response.data
          )
            ? response.data
            : []
      });

    } catch (error) {

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,
        error:
          error.message,
        status:
          error.response?.status ||
          null,
        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// ADMIN REVIEW
// ======================================================

app.post(
  "/api/admin/review",
  async function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        error:
          "ADMIN_UNAUTHORIZED",
        message:
          "دسترسی مدیریت نامعتبر است."
      });
    }

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    const {
      receiptId,
      action
    } = req.body || {};

    if (
      !receiptId ||
      ![
        "approve",
        "reject"
      ].includes(action)
    ) {

      return jsonError(
        res,
        400,
        "اطلاعات عملیات ناقص یا نامعتبر است."
      );
    }

    try {

      // ------------------------------------------------
      // READ RECEIPT
      // ------------------------------------------------

      const receipt =
        await getReceiptById(
          receiptId
        );

      if (!receipt) {

        return jsonError(
          res,
          404,
          "رسید پیدا نشد."
        );
      }

      // ------------------------------------------------
      // STATUS PROTECTION
      // ------------------------------------------------

      if (
        receipt.status ===
        "approved"
      ) {

        return res.status(409).json({
          success: false,
          code:
            "ALREADY_APPROVED",
          message:
            "این رسید قبلاً تأیید شده است."
        });
      }

      if (
        receipt.status ===
        "rejected"
      ) {

        return res.status(409).json({
          success: false,
          code:
            "ALREADY_REJECTED",
          message:
            "این رسید قبلاً رد شده است."
        });
      }

      const realUserId =
        receipt.user_id;

      if (!realUserId) {

        return jsonError(
          res,
          500,
          "این رسید به کاربر معتبر متصل نیست."
        );
      }

      // ------------------------------------------------
      // APPROVE
      // ------------------------------------------------

      if (
        action ===
        "approve"
      ) {

        const updateReceipt =
          await axios.patch(
            supabaseUrl(
              "receipts?id=eq." +
              encodeURIComponent(
                receiptId
              ) +
              "&status=eq.pending"
            ),
            {
              status:
                "approved"
            },
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        if (
          !Array.isArray(
            updateReceipt.data
          ) ||
          updateReceipt.data.length !== 1
        ) {

          return res.status(409).json({
            success: false,
            code:
              "RECEIPT_ALREADY_PROCESSED",
            message:
              "رسید قبلاً توسط درخواست دیگری پردازش شده است."
          });
        }

        try {

          await axios.patch(
            supabaseUrl(
              "users?id=eq." +
              encodeURIComponent(
                realUserId
              )
            ),
            {
              account_status:
                "active"
            },
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        } catch (userError) {

          // Roll back receipt if user activation fails
          try {

            await axios.patch(
              supabaseUrl(
                "receipts?id=eq." +
                encodeURIComponent(
                  receiptId
                ) +
                "&status=eq.approved"
              ),
              {
                status:
                  "pending"
              },
              {
                headers:
                  supabaseHeaders(),
                timeout: 10000
              }
            );

          } catch (rollbackError) {

            console.error(
              "APPROVE ROLLBACK ERROR:",
              errorInfo(
                rollbackError
              )
            );
          }

          throw userError;
        }

        await sendTelegramMessage(
          "✅ پرداخت تأیید شد\n\n" +
          `🆔 Receipt ID: ${receiptId}\n` +
          `👤 User ID: ${realUserId}\n` +
          `💰 مبلغ: ${receipt.amount} تومان`
        );

        return res.json({
          success: true,
          action:
            "approve",
          message:
            "رسید تأیید شد و حساب کاربر فعال شد."
        });
      }

      // ------------------------------------------------
      // REJECT
      // ------------------------------------------------

      const updateReceipt =
        await axios.patch(
          supabaseUrl(
            "receipts?id=eq." +
            encodeURIComponent(
              receiptId
            ) +
            "&status=eq.pending"
          ),
          {
            status:
              "rejected"
          },
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      if (
        !Array.isArray(
          updateReceipt.data
        ) ||
        updateReceipt.data.length !== 1
      ) {

        return res.status(409).json({
          success: false,
          code:
            "RECEIPT_ALREADY_PROCESSED",
          message:
            "رسید قبلاً توسط درخواست دیگری پردازش شده است."
        });
      }

      try {

        await axios.patch(
          supabaseUrl(
            "users?id=eq." +
            encodeURIComponent(
              realUserId
            )
          ),
          {
            account_status:
              "inactive"
          },
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      } catch (userError) {

        // Roll back receipt if user update fails
        try {

          await axios.patch(
            supabaseUrl(
              "receipts?id=eq." +
              encodeURIComponent(
                receiptId
              ) +
              "&status=eq.rejected"
            ),
            {
              status:
                "pending"
            },
            {
              headers:
                supabaseHeaders(),
              timeout: 10000
            }
          );

        } catch (rollbackError) {

          console.error(
            "REJECT ROLLBACK ERROR:",
            errorInfo(
              rollbackError
            )
          );
        }

        throw userError;
      }

      await sendTelegramMessage(
        "❌ رسید رد شد\n\n" +
        `🆔 Receipt ID: ${receiptId}\n` +
        `👤 User ID: ${realUserId}`
      );

      return res.json({
        success: true,
        action:
          "reject",
        message:
          "رسید رد شد و حساب کاربر غیرفعال شد."
      });

    } catch (error) {

      console.error(
        "ADMIN REVIEW ERROR:",
        errorInfo(error)
      );

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,

        error:
          error.message,

        status:
          error.response?.status ||
          null,

        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// ADMIN USER STATUS
// ======================================================

app.post(
  "/api/admin/user-status",
  async function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        error:
          "ADMIN_UNAUTHORIZED"
      });
    }

    const configError =
      requireSupabase(res);

    if (configError) {
      return configError;
    }

    const {
      userId,
      action
    } = req.body || {};

    if (
      !userId ||
      ![
        "block",
        "unblock"
      ].includes(action)
    ) {

      return jsonError(
        res,
        400,
        "اطلاعات وضعیت کاربر نامعتبر است."
      );
    }

    try {

      const newStatus =
        action === "block"
          ? "blocked"
          : "inactive";

      const response =
        await axios.patch(
          supabaseUrl(
            "users?id=eq." +
            encodeURIComponent(
              userId
            )
          ),
          {
            account_status:
              newStatus
          },
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      return res.json({
        success: true,

        status:
          newStatus,

        updated:
          Array.isArray(
            response.data
          )
            ? response.data.length
            : 0,

        message:
          action === "block"
            ? "کاربر مسدود شد."
            : "مسدودی کاربر برداشته شد."
      });

    } catch (error) {

      return res.status(
        error.response?.status === 401
          ? 401
          : 500
      ).json({
        success: false,
        error:
          error.message,
        status:
          error.response?.status ||
          null,
        details:
          error.response?.data ||
          null
      });
    }
  }
);

// ======================================================
// ADMIN PAGE
// ======================================================

app.get(
  "/admin",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return res.sendFile(
      path.join(
        publicDir,
        "admin.html"
      )
    );
  }
);

app.get(
  "/admin/",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return res.sendFile(
      path.join(
        publicDir,
        "admin.html"
      )
    );
  }
);

// ======================================================
// ROOT
// ======================================================

app.get(
  "/",
  function(req, res) {

    return res.sendFile(
      path.join(
        publicDir,
        "index.html"
      )
    );
  }
);

// ======================================================
// 404 API
// ======================================================

app.use(
  "/api",
  function(req, res) {

    return res.status(404).json({
      success: false,
      message:
        "API endpoint پیدا نشد."
    });
  }
);

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  function(error, req, res, next) {

    console.error(
      "GLOBAL ERROR:",
      errorInfo(error)
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "خطای داخلی سرور.",
      error:
        error.message
    });
  }
);

// ======================================================
// LOCAL SERVER
// ======================================================

if (require.main === module) {

  app.listen(
    PORT,
    function() {

      console.log(
        `TON Dropy backend running on port ${PORT}`
      );

    }
  );
}

// ======================================================
// EXPORT
// ======================================================

module.exports = app;
