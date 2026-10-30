const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// ======================================================
// CONFIG
// ======================================================

const TELEGRAM_BOT_TOKEN =
  "8959966218:AAEUympSifPNS_dGRSfvuBajSsijHH6GXgk";

const TELEGRAM_CHAT_ID =
  "5972276401";

const ADMIN_SECRET =
  "TondropyAdmin2026";

// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://vqddirelnxiklannquuu.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_HKt6R2jtn5e59R5K8fI9wnQ_tFEm-TJ5";

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

// ======================================================
// APP
// ======================================================

app.use(cors());

app.use(
  express.json({
    limit: "15mb"
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

function jsonError(res, status, message, extra) {
  return res.status(status).json({
    success: false,
    message,
    ...(extra || {})
  });
}

function getAdminSecret(req) {
  return (
    req.query?.secret ||
    req.body?.secret ||
    req.headers["x-admin-secret"] ||
    req.headers["x-admin-key"] ||
    (
      typeof req.headers.authorization === "string" &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.substring(7)
        : null
    ) ||
    ""
  );
}

function isAdmin(req) {
  return String(getAdminSecret(req)) ===
    String(ADMIN_SECRET);
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
        .sort(function(a, b) {
          return a[0].localeCompare(b[0]);
        })
        .map(function(pair) {
          return pair[0] + "=" + pair[1];
        })
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
      error
    );

    return false;
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
      SUPABASE_URL +
        "/rest/v1/users?telegram_id=eq." +
        encodeURIComponent(telegramId) +
        "&select=*",
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

async function getUserById(userId) {

  const response =
    await axios.get(
      SUPABASE_URL +
        "/rest/v1/users?id=eq." +
        encodeURIComponent(userId) +
        "&select=*",
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

    res.json({
      success: true,
      service: "TON Dropy backend",
      status: "online",
      time: new Date().toISOString()
    });

  }
);

// ======================================================
// TEST DATABASE
// ======================================================

app.get(
  "/api/test-db",
  async function(req, res) {

    try {

      const response =
        await axios.get(
          SUPABASE_URL +
            "/rest/v1/users?select=id,telegram_id,username&limit=1",
          {
            headers:
              supabaseHeaders(),
            timeout: 10000
          }
        );

      return res.json({
        success: true,
        message:
          "اتصال به دیتابیس موفق بود",
        data:
          response.data
      });

    } catch (error) {

      console.error(
        "TEST DB ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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

    try {

      const initData =
        req.body?.initData;

      if (!initData) {

        return jsonError(
          res,
          400,
          "initData ارسال نشده است."
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
          JSON.parse(userString);

      } catch (error) {

        return jsonError(
          res,
          400,
          "اطلاعات کاربر Telegram قابل خواندن نیست."
        );

      }

      let user =
        await getUserByTelegramId(
          tgUser.id
        );

      // -----------------------------------------------
      // CREATE USER
      // -----------------------------------------------

      if (!user) {

        const insertResponse =
          await axios.post(
            SUPABASE_URL +
              "/rest/v1/users",
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
                "user",

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

        // ---------------------------------------------
        // UPDATE TELEGRAM INFORMATION
        // ---------------------------------------------

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
            "user"
        };

        await axios.patch(
          SUPABASE_URL +
            "/rest/v1/users?id=eq." +
            encodeURIComponent(user.id),
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
        "inactive";

      // پشتیبانی از نام‌های قدیمی
      if (
        user.status &&
        !user.account_status
      ) {
        accountStatus =
          user.status;
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
            "user",

          status:
            accountStatus
        }
      });

    } catch (error) {

      console.error(
        "AUTH ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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

    try {

      const {
        telegramId,
        userId,
        username,
        amount,
        method,
        imageBase64
      } = req.body || {};

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
        5000000
      ) {

        return jsonError(
          res,
          400,
          "حجم عکس زیاد است."
        );

      }

      // -----------------------------------------------
      // FIND USER
      // -----------------------------------------------

      let user = null;

      if (telegramId) {

        user =
          await getUserByTelegramId(
            telegramId
          );

      }

      if (!user && userId) {

        user =
          await getUserById(
            userId
          );

      }

      if (
        !user &&
        username
      ) {

        const response =
          await axios.get(
            SUPABASE_URL +
              "/rest/v1/users?username=eq." +
              encodeURIComponent(username) +
              "&select=*",
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

      // -----------------------------------------------
      // BLOCKED USER
      // -----------------------------------------------

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

      // -----------------------------------------------
      // PREVENT DUPLICATE PENDING RECEIPT
      // -----------------------------------------------

      const duplicateResponse =
        await axios.get(
          SUPABASE_URL +
            "/rest/v1/receipts?user_id=eq." +
            encodeURIComponent(user.id) +
            "&status=eq.pending" +
            "&select=id&limit=1",
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
        duplicateResponse.data.length > 0
      ) {

        return jsonError(
          res,
          409,
          "برای این حساب یک رسید در انتظار بررسی وجود دارد."
        );

      }

      // -----------------------------------------------
      // CREATE RECEIPT
      // -----------------------------------------------

      const receiptResponse =
        await axios.post(
          SUPABASE_URL +
            "/rest/v1/receipts",
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
        receiptResponse.data?.[0];

      if (!receipt) {

        throw new Error(
          "رسید در Supabase ثبت نشد."
        );

      }

      // -----------------------------------------------
      // USER -> PENDING
      // -----------------------------------------------

      await axios.patch(
        SUPABASE_URL +
          "/rest/v1/users?id=eq." +
          encodeURIComponent(user.id),
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

      // -----------------------------------------------
      // SEND RECEIPT TO TELEGRAM
      // -----------------------------------------------

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
          "Node.js 18 یا بالاتر لازم است."
        );

      }

      const formData =
        new FormDataClass();

      formData.append(
        "chat_id",
        TELEGRAM_CHAT_ID
      );

      formData.append(
        "caption",

        "🧾 رسید جدید\n" +
        "━━━━━━━━━━━━\n" +
        "👤 کاربر: @" +
        (
          user.username ||
          username ||
          "user"
        ) +
        "\n" +
        "🆔 Telegram ID: " +
        (
          user.telegram_id ||
          telegramId ||
          ""
        ) +
        "\n" +
        "💰 مبلغ: " +
        numericAmount +
        " تومان\n" +
        "💳 روش: " +
        (
          method === "full"
            ? "پرداخت کامل"
            : "اقساطی"
        ) +
        "\n" +
        "🆔 Receipt ID: " +
        receipt.id
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
          "https://api.telegram.org/bot" +
          TELEGRAM_BOT_TOKEN +
          "/sendPhoto",
          {
            method: "POST",
            body:
              formData
          }
        );

      const telegramData =
        await telegramResponse.json();

      if (
        !telegramData.ok
      ) {

        console.error(
          "TELEGRAM SEND ERROR:",
          telegramData
        );

        return res.status(502).json({
          success: false,

          message:
            "رسید در دیتابیس ثبت شد اما ارسال آن به Telegram ناموفق بود.",

          telegram_error:
            telegramData.description ||
            "Telegram error",

          receipt_id:
            receipt.id
        });

      }

      return res.json({
        success: true,

        message:
          "رسید با موفقیت ثبت شد.",

        receipt_id:
          receipt.id
      });

    } catch (error) {

      console.error(
        "UPLOAD RECEIPT ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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
// ADMIN AUTH TEST
// ======================================================

app.get(
  "/api/admin/check",
  function(req, res) {

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        authenticated: false,
        error:
          "ADMIN_UNAUTHORIZED"
      });

    }

    return res.json({
      success: true,
      authenticated: true,
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

    // مهم:
    // قبلاً این endpoint فقط query secret را قبول می‌کرد.
    // اکنون query/header/body هم پشتیبانی می‌شود
    // تا مشکل 401 پنل برطرف شود.

    if (!isAdmin(req)) {

      return res.status(401).json({
        success: false,
        error:
          "ADMIN_UNAUTHORIZED",
        message:
          "کلید مدیریت نامعتبر است."
      });

    }

    try {

      const receiptsResponse =
        await axios.get(
          SUPABASE_URL +
            "/rest/v1/receipts" +
            "?status=eq.pending" +
            "&select=*" +
            "&order=created_at.desc",
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

      if (
        receipts.length === 0
      ) {

        return res.json([]);

      }

      const userIds =
        [
          ...new Set(
            receipts
              .map(function(item) {
                return item.user_id;
              })
              .filter(Boolean)
          )
        ];

      let users = [];

      if (
        userIds.length > 0
      ) {

        const orQuery =
          userIds
            .map(function(id) {
              return (
                "id.eq." +
                encodeURIComponent(id)
              );
            })
            .join(",");

        const usersResponse =
          await axios.get(
            SUPABASE_URL +
              "/rest/v1/users" +
              "?select=id,telegram_id,username,first_name,account_status" +
              "&or=(" +
              orQuery +
              ")",
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
        receipts.map(function(receipt) {

          const user =
            users.find(function(item) {

              return String(
                item.id
              ) === String(
                receipt.user_id
              );

            });

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

            account_status:
              user?.account_status ||
              "inactive",

            users:
              user
                ? {
                    username:
                      user.username,

                    telegram_id:
                      user.telegram_id,

                    first_name:
                      user.first_name,

                    account_status:
                      user.account_status
                  }
                : null
          };

        });

      return res.json(
        result
      );

    } catch (error) {

      console.error(
        "ADMIN RECEIPTS ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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
// ADMIN ALL USERS
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

    try {

      const response =
        await axios.get(
          SUPABASE_URL +
            "/rest/v1/users" +
            "?select=*" +
            "&order=created_at.desc",
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

      console.error(
        "ADMIN USERS ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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
// ADMIN REVIEW RECEIPT
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

    const {
      receiptId,
      userId,
      action
    } = req.body || {};

    if (
      !receiptId ||
      !userId ||
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

      // -----------------------------------------------
      // READ RECEIPT FIRST
      // -----------------------------------------------

      const receiptResponse =
        await axios.get(
          SUPABASE_URL +
            "/rest/v1/receipts" +
            "?id=eq." +
            encodeURIComponent(
              receiptId
            ) +
            "&select=*",
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

        return jsonError(
          res,
          404,
          "رسید پیدا نشد."
        );

      }

      // -----------------------------------------------
      // IMPORTANT:
      // PREVENT DOUBLE APPROVAL
      // -----------------------------------------------

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

      // -----------------------------------------------
      // APPROVE
      // -----------------------------------------------

      if (
        action ===
        "approve"
      ) {

        const updateReceipt =
          await axios.patch(
            SUPABASE_URL +
              "/rest/v1/receipts" +
              "?id=eq." +
              encodeURIComponent(
                receiptId
              ) +
              "&status=eq.pending",
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

        // اگر هیچ رکوردی تغییر نکرد
        // یعنی احتمالاً قبلاً توسط درخواست دیگری
        // تغییر کرده است.

        if (
          Array.isArray(
            updateReceipt.data
          ) &&
          updateReceipt.data.length === 0
        ) {

          return res.status(409).json({
            success: false,
            code:
              "RECEIPT_ALREADY_PROCESSED",
            message:
              "رسید قبلاً پردازش شده است."
          });

        }

        await axios.patch(
          SUPABASE_URL +
            "/rest/v1/users" +
            "?id=eq." +
            encodeURIComponent(
              userId
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

        // ---------------------------------------------
        // TELEGRAM NOTIFICATION
        // ---------------------------------------------

        try {

          await axios.post(
            "https://api.telegram.org/bot" +
            TELEGRAM_BOT_TOKEN +
            "/sendMessage",
            {
              chat_id:
                TELEGRAM_CHAT_ID,

              text:
                "✅ پرداخت تأیید شد\n\n" +
                "🆔 Receipt ID: " +
                receiptId +
                "\n" +
                "👤 User ID: " +
                userId +
                "\n" +
                "💰 مبلغ: " +
                receipt.amount +
                " تومان"
            },
            {
              timeout: 10000
            }
          );

        } catch (
          telegramError
        ) {

          console.error(
            "TELEGRAM APPROVE NOTIFICATION ERROR:",
            telegramError.message
          );

        }

        return res.json({
          success: true,

          action:
            "approve",

          message:
            "رسید تأیید شد و حساب کاربر فعال شد."
        });
      }

      // -----------------------------------------------
      // REJECT
      // -----------------------------------------------

      if (
        action ===
        "reject"
      ) {

        await axios.patch(
          SUPABASE_URL +
            "/rest/v1/receipts" +
            "?id=eq." +
            encodeURIComponent(
              receiptId
            ) +
            "&status=eq.pending",
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

        await axios.patch(
          SUPABASE_URL +
            "/rest/v1/users" +
            "?id=eq." +
            encodeURIComponent(
              userId
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

        try {

          await axios.post(
            "https://api.telegram.org/bot" +
            TELEGRAM_BOT_TOKEN +
            "/sendMessage",
            {
              chat_id:
                TELEGRAM_CHAT_ID,

              text:
                "❌ رسید رد شد\n\n" +
                "🆔 Receipt ID: " +
                receiptId +
                "\n" +
                "👤 User ID: " +
                userId
            },
            {
              timeout: 10000
            }
          );

        } catch (
          telegramError
        ) {

          console.error(
            "TELEGRAM REJECT NOTIFICATION ERROR:",
            telegramError.message
          );

        }

        return res.json({
          success: true,

          action:
            "reject",

          message:
            "رسید رد شد و حساب کاربر به حالت غیرفعال برگشت."
        });
      }

    } catch (error) {

      console.error(
        "ADMIN REVIEW ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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
// ADMIN BLOCK / UNBLOCK USER
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

      await axios.patch(
        SUPABASE_URL +
          "/rest/v1/users?id=eq." +
          encodeURIComponent(
            userId
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

        message:
          action === "block"
            ? "کاربر مسدود شد."
            : "مسدودی کاربر برداشته شد."
      });

    } catch (error) {

      console.error(
        "USER STATUS ERROR:",
        errorInfo(error)
      );

      return res.status(500).json({
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
// ADMIN PANEL
// ======================================================

const adminHtml = String.raw`<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1"
>

<title>TON Dropy Admin</title>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  padding:18px;
  font-family:Vazirmatn,system-ui,sans-serif;
  background:
    radial-gradient(
      circle at 10% 0%,
      #e5f1ff,
      transparent 35%
    ),
    #f4f7fb;
  color:#0f172a;
}

.container{
  max-width:760px;
  margin:auto;
}

.header{
  background:rgba(255,255,255,.88);
  border-radius:30px;
  padding:24px;
  box-shadow:0 10px 35px rgba(0,0,0,.07);
  margin-bottom:16px;
}

.header-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

h1{
  margin:0;
  color:#1677ff;
  font-size:25px;
  font-weight:900;
}

.subtitle{
  color:#64748b;
  margin-top:5px;
  font-size:13px;
}

.online{
  background:#dcfce7;
  color:#16a34a;
  padding:8px 13px;
  border-radius:20px;
  font-weight:800;
  white-space:nowrap;
}

.toolbar{
  display:flex;
  gap:10px;
  margin-top:18px;
}

.toolbar button{
  flex:1;
}

button{
  border:0;
  border-radius:17px;
  padding:14px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
}

.refresh{
  background:#1677ff;
  color:white;
  box-shadow:0 8px 24px rgba(22,119,255,.2);
}

.logout{
  background:white;
  border:1px solid #dbe3ee;
  color:#475569;
}

.card{
  background:rgba(255,255,255,.9);
  border-radius:25px;
  padding:20px;
  margin-bottom:14px;
  box-shadow:0 7px 25px rgba(0,0,0,.05);
}

.row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  margin-bottom:9px;
}

.label{
  color:#64748b;
}

.value{
  font-weight:800;
}

.receipt{
  width:100%;
  max-height:500px;
  object-fit:contain;
  border-radius:16px;
  background:#f1f5f9;
  margin-top:15px;
}

.actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:14px;
}

.approve{
  background:#22c55e;
  color:#fff;
}

.reject{
  background:#ef4444;
  color:#fff;
}

.empty{
  text-align:center;
  color:#64748b;
  padding:35px 10px;
}

.error{
  background:#fff1f2;
  color:#b91c1c;
  border:1px solid #fecdd3;
}

.success{
  background:#ecfdf5;
  color:#15803d;
  border:1px solid #bbf7d0;
}

pre{
  white-space:pre-wrap;
  word-break:break-word;
  direction:ltr;
  text-align:left;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="header-top">

<div>

<h1>
TON Dropy
</h1>

<div class="subtitle">
پنل مدیریت پرداخت‌ها و فعال‌سازی کاربران
</div>

</div>

<div class="online">
● آنلاین
</div>

</div>

<div class="toolbar">

<button
  class="refresh"
  onclick="loadReceipts()"
>
🔄 بروزرسانی رسیدها
</button>

<button
  class="logout"
  onclick="logout()"
>
خروج
</button>

</div>

</div>

<div id="message"></div>

<div id="list">
<div class="card empty">
در حال دریافت رسیدها...
</div>
</div>

</div>

<script>

const params =
  new URLSearchParams(
    window.location.search
  );

const secret =
  params.get("secret") || "";

function showMessage(
  text,
  type
){

  const el =
    document.getElementById(
      "message"
    );

  el.innerHTML =
    '<div class="card ' +
    type +
    '">' +
    escapeHtml(text) +
    '</div>';

}

function escapeHtml(value){

  return String(
    value ?? ""
  )
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}

async function api(
  url,
  options
){

  const finalOptions =
    options || {};

  finalOptions.headers =
    Object.assign(
      {},
      finalOptions.headers || {},
      {
        "x-admin-secret":
          secret
      }
    );

  const response =
    await fetch(
      url,
      finalOptions
    );

  let data;

  try{
    data =
      await response.json();
  }catch(e){
    data = {};
  }

  if(
    !response.ok
  ){

    throw new Error(
      data.message ||
      data.error ||
      (
        "HTTP " +
        response.status
      )
    );

  }

  return data;

}

async function loadReceipts(){

  const list =
    document.getElementById(
      "list"
    );

  list.innerHTML =
    '<div class="card empty">' +
    'در حال دریافت رسیدها...' +
    '</div>';

  try{

    const data =
      await api(
        "/api/admin/receipts-v2?secret=" +
        encodeURIComponent(
          secret
        ) +
        "&_=" +
        Date.now()
      );

    if(
      !Array.isArray(data)
    ){

      throw new Error(
        "فرمت اطلاعات رسیدها نامعتبر است."
      );

    }

    if(
      data.length === 0
    ){

      list.innerHTML =
        '<div class="card empty">' +
        '🧾 هیچ رسید در انتظار تأییدی وجود ندارد.' +
        '</div>';

      return;

    }

    list.innerHTML = "";

    data.forEach(
      function(item){

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "card";

        card.id =
          "receipt-" +
          item.id;

        const username =
          item.username ||
          item.users?.username ||
          "ناشناس";

        const method =
          item.method ===
          "full"
            ? "پرداخت کامل"
            : "اقساطی";

        const image =
          item.image_url
            ? (
              '<img class="receipt" src="' +
              escapeHtml(
                item.image_url
              ) +
              '" alt="receipt">'
            )
            : (
              '<div class="empty">' +
              'تصویر رسید در دیتابیس ذخیره نشده است.' +
              '<br>' +
              'تصویر رسید از طریق Telegram ارسال شده است.' +
              '</div>'
            );

        card.innerHTML =

          '<div class="row">' +
            '<span class="label">کاربر</span>' +
            '<span class="value">@' +
              escapeHtml(
                username
              ) +
            '</span>' +
          '</div>' +

          '<div class="row">' +
            '<span class="label">Telegram ID</span>' +
            '<span class="value">' +
              escapeHtml(
                item.telegram_id
              ) +
            '</span>' +
          '</div>' +

          '<div class="row">' +
            '<span class="label">مبلغ</span>' +
            '<span class="value">' +
              escapeHtml(
                item.amount
              ) +
              ' تومان' +
            '</span>' +
          '</div>' +

          '<div class="row">' +
            '<span class="label">روش</span>' +
            '<span class="value">' +
              method +
            '</span>' +
          '</div>' +

          '<div class="row">' +
            '<span class="label">وضعیت</span>' +
            '<span class="value">' +
              escapeHtml(
                item.status
              ) +
            '</span>' +
          '</div>' +

          image +

          '<div class="actions">' +

            '<button class="approve">' +
              '✅ تأیید پرداخت' +
            '</button>' +

            '<button class="reject">' +
              '❌ رد پرداخت' +
            '</button>' +

          '</div>';

        card
          .querySelector(
            ".approve"
          )
          .onclick =
            function(){
              review(
                item.id,
                item.user_id,
                "approve"
              );
            };

        card
          .querySelector(
            ".reject"
          )
          .onclick =
            function(){
              review(
                item.id,
                item.user_id,
                "reject"
              );
            };

        list.appendChild(
          card
        );

      }
    );

  }catch(error){

    console.error(
      error
    );

    list.innerHTML =
      '<div class="card error">' +
      '<b>❌ دریافت رسیدها ناموفق بود</b>' +
      '<br><br>' +
      escapeHtml(
        error.message
      ) +
      '<br><br>' +
      '<button class="refresh" onclick="loadReceipts()">' +
      '🔄 تلاش مجدد' +
      '</button>' +
      '</div>';

  }

}

async function review(
  receiptId,
  userId,
  action
){

  const text =
    action === "approve"
      ? "آیا از تأیید این پرداخت مطمئن هستید؟"
      : "آیا این رسید رد شود؟";

  if(
    !confirm(text)
  ){
    return;
  }

  try{

    const data =
      await api(
        "/api/admin/review",
        {
          method:
            "POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              receiptId:
                receiptId,

              userId:
                userId,

              action:
                action,

              secret:
                secret
            })
        }
      );

    showMessage(
      data.message ||
      "عملیات با موفقیت انجام شد.",
      "success"
    );

    const card =
      document.getElementById(
        "receipt-" +
        receiptId
      );

    if(card){
      card.remove();
    }

    setTimeout(
      loadReceipts,
      500
    );

  }catch(error){

    console.error(
      error
    );

    showMessage(
      error.message,
      "error"
    );

  }

}

function logout(){

  window.location.href =
    "/admin";

}

if(
  !secret
){

  document.getElementById(
    "list"
  ).innerHTML =
    '<div class="card error">' +
    '<b>دسترسی غیرمجاز</b>' +
    '<br><br>' +
    'پنل مدیریت باید با کلید مدیریت باز شود.' +
    '</div>';

}else{

  loadReceipts();

}

</script>

</body>

</html>`;

// ======================================================
// ADMIN PAGE
// ======================================================

app.get(
  "/admin",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    return res.send(
      adminHtml
    );

  }
);

// ======================================================
// USER MINI APP HTML
// ======================================================

const userHtml = String.raw`<!DOCTYPE html>

<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
>

<title>TON Dropy</title>

<script src="https://telegram.org/js/telegram-web-app.js"></script>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
>

<style>

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,
body{
  margin:0;
  padding:0;
  min-height:100%;
}

body{
  font-family:Vazirmatn,system-ui,sans-serif;
  color:#0b1220;
  background:
    radial-gradient(
      circle at 10% 0%,
      #e5f1ff,
      transparent 35%
    ),
    radial-gradient(
      circle at 90% 100%,
      #eef8ff,
      transparent 35%
    ),
    #f5f8fc;
}

#app{
  width:100%;
  max-width:480px;
  margin:auto;
  padding:18px 14px 40px;
}

.card{
  background:rgba(255,255,255,.88);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.95);
  border-radius:26px;
  padding:22px;
  margin-bottom:14px;
  box-shadow:0 8px 30px rgba(0,0,0,.05);
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

h1{
  font-size:23px;
  color:#0a84ff;
  margin:0;
  font-weight:900;
}

.muted{
  color:#64748b;
  font-size:13px;
}

.status{
  padding:7px 12px;
  border-radius:18px;
  font-size:12px;
  font-weight:800;
}

.title{
  font-size:19px;
  font-weight:900;
  margin-bottom:14px;
}

.amount{
  font-size:30px;
  font-weight:900;
  color:#0a84ff;
}

button{
  width:100%;
  border:0;
  border-radius:17px;
  padding:15px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
  margin-top:10px;
}

button:disabled{
  opacity:.55;
}

.primary{
  background:#0a84ff;
  color:#fff;
}

.green{
  background:#22c55e;
  color:#fff;
}

.red{
  background:#ef4444;
  color:#fff;
}

.light{
  background:#eef6ff;
  color:#0066cc;
}

.methods{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.method{
  padding:16px;
  border:2px solid transparent;
  border-radius:18px;
  background:#f8fafc;
  text-align:center;
  font-weight:800;
}

.method.active{
  border-color:#0a84ff;
  background:#eff6ff;
}

.upload{
  display:block;
  border:2px dashed #a8cdfc;
  border-radius:18px;
  padding:28px;
  text-align:center;
  color:#0a84ff;
  cursor:pointer;
}

input[type=file]{
  display:none;
}

.preview{
  width:100%;
  max-height:260px;
  object-fit:contain;
  border-radius:14px;
  margin-top:12px;
  background:#f8fafc;
}

.hidden{
  display:none !important;
}

.blocked{
  border:2px solid #ef4444;
  text-align:center;
}

.pending{
  border:2px solid #f59e0b;
  text-align:center;
}

.active{
  border:2px solid #22c55e;
  text-align:center;
}

</style>

</head>

<body>

<div id="app">

<div class="card header">

<div>

<h1>
TON Dropy
</h1>

<div class="muted">
فعال‌سازی حساب
</div>

</div>

<div
  id="status"
  class="status"
  style="background:#fee2e2;color:#ef4444"
>
فعال نشده
</div>

</div>


<div
  id="loading"
  class="card"
  style="text-align:center"
>
در حال ارتباط...
</div>


<div
  id="error"
  class="card hidden"
  style="color:#b91c1c;text-align:center"
></div>


<div
  id="blocked"
  class="card blocked hidden"
>

<div style="font-size:52px">
🚫
</div>

<div class="title" style="color:#ef4444">
حساب شما مسدود شده است
</div>

<div class="muted">
دسترسی شما به TON Dropy مسدود شده است.
</div>

</div>


<div
  id="inactive"
  class="hidden"
>

<div class="card">

سلام
<b id="name"></b>
عزیز 👋

<div
  class="muted"
  style="margin-top:7px"
>
برای استفاده، حساب خود را فعال کنید.
</div>

</div>


<div
  class="card"
  style="text-align:center"
>

<div class="muted">
هزینه فعال‌سازی
</div>

<div class="amount">
۳,۷۸۰,۰۰۰
<span style="font-size:15px">
تومان
</span>
</div>

<div class="muted">
معادل ۱۴ دلار
</div>

</div>


<div class="card">

<div class="title">
روش پرداخت
</div>

<div class="methods">

<div
  id="full"
  class="method active"
  onclick="setMethod('full')"
>
کامل
<br>
<span style="color:#0a84ff">
۳,۷۸۰,۰۰۰
</span>
</div>

<div
  id="installment"
  class="method"
  onclick="setMethod('installment')"
>
اقساطی
<br>
<span style="color:#0a84ff">
۹۴۵,۰۰۰
</span>
</div>

</div>

</div>


<div class="card">

<div class="title">
کارت به کارت
</div>

<div class="muted">
بانک شهر — نیما اسفندیاری
</div>

<div
  style="
    font-size:22px;
    font-weight:900;
    margin:12px 0;
    direction:ltr;
  "
>
5047061674676966
</div>

<button
  class="light"
  onclick="copyCard()"
>
کپی شماره کارت
</button>

<div
  style="
    margin-top:14px;
    text-align:center;
  "
>

<div class="muted">
مبلغ قابل پرداخت
</div>

<div
  id="dynamicAmount"
  class="amount"
>
۳,۷۸۰,۰۰۰
</div>

</div>

</div>


<div class="card">

<div class="title">
ارسال رسید
</div>

<label
  class="upload"
  id="uploadBox"
>

📎
<br>

<b>
انتخاب عکس رسید
</b>

<input
  id="file"
  type="file"
  accept="image/*"
  onchange="handleFile(event)"
>

</label>


<img
  id="preview"
  class="preview hidden"
>


<div
  id="fileName"
  class="muted"
  style="margin-top:8px"
></div>


<button
  id="removeBtn"
  class="red hidden"
  onclick="removeReceipt()"
>
حذف رسید
</button>


<button
  id="sendBtn"
  class="primary"
  onclick="uploadReceipt()"
>
ارسال رسید
</button>

</div>

</div>


<div
  id="pending"
  class="card pending hidden"
>

<div style="font-size:50px">
⏳
</div>

<div
  class="title"
  style="color:#f59e0b"
>
در انتظار تأیید
</div>

<div class="muted">
رسید شما توسط مدیریت بررسی می‌شود.
</div>

</div>


<div
  id="active"
  class="card active hidden"
>

<div style="font-size:50px">
✅
</div>

<div
  class="title"
  style="color:#22c55e"
>
حساب شما فعال است
</div>

<div class="muted">
به TON Dropy خوش آمدید.
</div>

</div>

</div>


<script>

var tg =
  window.Telegram &&
  window.Telegram.WebApp;

var initData = "";

var currentUser = null;

var currentMethod =
  "full";

var receiptBase64 =
  "";

function $(id){
  return document.getElementById(id);
}

function showOnly(id){

  [
    "inactive",
    "pending",
    "active",
    "blocked"
  ].forEach(
    function(item){
      $(item)
        .classList
        .add("hidden");
    }
  );

  if(id){
    $(id)
      .classList
      .remove("hidden");
  }
}

function setStatus(
  text,
  color,
  background
){

  $("status")
    .textContent =
    text;

  $("status")
    .style.color =
    color;

  $("status")
    .style.background =
    background;
}

function showError(
  message
){

  $("loading")
    .classList
    .add("hidden");

  $("error")
    .textContent =
    message;

  $("error")
    .classList
    .remove("hidden");
}

function renderUser(
  user
){

  currentUser =
    user;

  $("loading")
    .classList
    .add("hidden");

  $("name")
    .textContent =
    user.name ||
    "کاربر";

  if(
    user.status ===
    "blocked"
  ){

    showOnly(
      "blocked"
    );

    setStatus(
      "مسدود",
      "#ef4444",
      "#fee2e2"
    );

    return;
  }

  if(
    user.status ===
    "active"
  ){

    showOnly(
      "active"
    );

    setStatus(
      "فعال",
      "#16a34a",
      "#dcfce7"
    );

    return;
  }

  if(
    user.status ===
    "pending"
  ){

    showOnly(
      "pending"
    );

    setStatus(
      "در انتظار",
      "#d97706",
      "#fef3c7"
    );

    return;
  }

  showOnly(
    "inactive"
  );

  setStatus(
    "فعال نشده",
    "#ef4444",
    "#fee2e2"
  );
}

async function authenticate(){

  if(
    !tg
  ){

    showError(
      "این صفحه باید از داخل Telegram باز شود."
    );

    return;
  }

  try{

    tg.ready();

    tg.expand();

    initData =
      tg.initData;

    if(
      !initData
    ){

      showError(
        "از طریق ربات Telegram وارد شوید."
      );

      return;
    }

    const response =
      await fetch(
        "/api/auth/telegram",
        {
          method:
            "POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              initData:
                initData
            })
        }
      );

    const data =
      await response.json();

    if(
      !response.ok ||
      !data.success
    ){

      showError(
        data.message ||
        "احراز هویت ناموفق بود."
      );

      return;
    }

    renderUser(
      data.user
    );

  }catch(error){

    console.error(
      error
    );

    showError(
      "خطا در ارتباط با سرور."
    );

  }

}

function setMethod(
  method
){

  currentMethod =
    method;

  $("full")
    .classList
    .remove("active");

  $("installment")
    .classList
    .remove("active");

  if(
    method ===
    "full"
  ){

    $("full")
      .classList
      .add("active");

    $("dynamicAmount")
      .textContent =
      "۳,۷۸۰,۰۰۰";

  }else{

    $("installment")
      .classList
      .add("active");

    $("dynamicAmount")
      .textContent =
      "۹۴۵,۰۰۰";
  }
}

async function copyCard(){

  const number =
    "5047061674676966";

  try{

    await navigator
      .clipboard
      .writeText(
        number
      );

    alert(
      "شماره کارت کپی شد ✓"
    );

  }catch(error){

    alert(
      number
    );

  }
}

function handleFile(
  event
){

  const file =
    event.target.files?.[0];

  if(
    !file
  ){
    return;
  }

  if(
    !file.type.startsWith(
      "image/"
    )
  ){

    alert(
      "فقط فایل تصویری انتخاب کنید."
    );

    return;
  }

  if(
    file.size >
    3000000
  ){

    alert(
      "حجم عکس نباید بیشتر از ۳ مگابایت باشد."
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload =
    function(e){

      receiptBase64 =
        e.target.result;

      $("preview")
        .src =
        receiptBase64;

      $("preview")
        .classList
        .remove("hidden");

      $("fileName")
        .textContent =
        file.name;

      $("removeBtn")
        .classList
        .remove("hidden");

      $("uploadBox")
        .classList
        .add("hidden");

    };

  reader.readAsDataURL(
    file
  );
}

function removeReceipt(){

  receiptBase64 =
    "";

  $("file")
    .value =
    "";

  $("preview")
    .src =
    "";

  $("preview")
    .classList
    .add("hidden");

  $("fileName")
    .textContent =
    "";

  $("removeBtn")
    .classList
    .add("hidden");

  $("uploadBox")
    .classList
    .remove("hidden");
}

async function uploadReceipt(){

  if(
    !receiptBase64
  ){

    alert(
      "ابتدا عکس رسید را انتخاب کنید."
    );

    return;
  }

  if(
    !currentUser
  ){

    alert(
      "اطلاعات کاربر آماده نیست."
    );

    return;
  }

  const button =
    $("sendBtn");

  button.disabled =
    true;

  button.textContent =
    "در حال ارسال...";

  try{

    const amount =
      currentMethod ===
      "full"
        ? "3780000"
        : "945000";

    const response =
      await fetch(
        "/api/upload-receipt",
        {
          method:
            "POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              telegramId:
                currentUser.telegram_id,

              userId:
                currentUser.id,

              username:
                currentUser.username,

              amount:
                amount,

              method:
                currentMethod,

              imageBase64:
                receiptBase64

            })
        }
      );

    const data =
      await response.json();

    if(
      !response.ok ||
      !data.success
    ){

      throw new Error(
        data.message ||
        data.error ||
        "ارسال رسید ناموفق بود."
      );

    }

    showOnly(
      "pending"
    );

    setStatus(
      "در انتظار",
      "#d97706",
      "#fef3c7"
    );

    receiptBase64 =
      "";

  }catch(error){

    console.error(
      error
    );

    alert(
      error.message ||
      "خطا در ارتباط با سرور."
    );

    button.disabled =
      false;

    button.textContent =
      "ارسال رسید";
  }
}

authenticate();

</script>

</body>

</html>`;

// ======================================================
// HOME
// ======================================================

app.get(
  "/",
  function(req, res) {

    res.setHeader(
      "Cache-Control",
      "no-store,no-cache,must-revalidate,proxy-revalidate"
    );

    return res.send(
      userHtml
    );

  }
);

// ======================================================
// FALLBACK
// ======================================================

app.use(
  function(req, res) {

    res.status(404).json({
      success: false,
      error:
        "ROUTE_NOT_FOUND",
      message:
        "مسیر مورد نظر پیدا نشد.",
      path:
        req.path
    });

  }
);

// ======================================================
// EXPORT FOR VERCEL
// ======================================================

module.exports = app;
