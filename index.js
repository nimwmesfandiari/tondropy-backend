"use strict";

const app = require("./server");

const SUPABASE_URL = String(
  process.env.SUPABASE_URL ||
  "https://vqddirelnxiklannquuu.supabase.co"
).replace(/\/+$/, "");

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  "";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ||
  "";

function configured(value) {
  return Boolean(value && String(value).trim());
}

function authorized(req) {
  if (!configured(ADMIN_SECRET)) return false;

  const header = String(
    req.headers["x-admin-secret"] || ""
  ).trim();

  const auth = String(
    req.headers.authorization || ""
  ).trim();

  const bearer = auth.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : "";

  const query = String(
    req.query?.secret || ""
  ).trim();

  return (
    header === ADMIN_SECRET ||
    bearer === ADMIN_SECRET ||
    query === ADMIN_SECRET
  );
}

async function supabaseRequest(
  path,
  options = {}
) {
  if (!configured(SUPABASE_KEY)) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured on Vercel."
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      method:
        options.method || "GET",

      headers: {
        apikey: SUPABASE_KEY,

        Authorization:
          `Bearer ${SUPABASE_KEY}`,

        "Content-Type":
          "application/json",

        Accept:
          "application/json",

        Prefer:
          options.prefer ||
          "return=representation",

        ...(options.headers || {})
      },

      body:
        options.body
    }
  );

  const text =
    await response.text();

  let data = null;

  try {
    data =
      text
        ? JSON.parse(text)
        : null;
  } catch (_) {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.hint ||
      data?.details ||
      data?.error_description ||
      `Supabase HTTP ${response.status}`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.details =
      data;

    throw error;
  }

  return data;
}


/*
=========================================================
GET USERS
=========================================================
*/

async function getUsers() {

  return await supabaseRequest(
    "users?select=id,telegram_id,username,first_name,last_name,account_status&limit=5000",
    {
      method: "GET"
    }
  );

}


/*
=========================================================
ADMIN RECEIPTS
=========================================================
*/

async function adminReceipts(
  req,
  res
) {

  if (!authorized(req)) {

    return res
      .status(401)
      .json({
        success: false,
        error:
          "Unauthorized."
      });

  }

  try {

    /*
     * دریافت رسیدها
     *
     * توجه:
     * reviewed_at عمداً در اینجا استفاده نشده است.
     */

    const receipts =
      await supabaseRequest(
        "receipts?select=*&order=created_at.desc",
        {
          method: "GET"
        }
      );


    /*
     * دریافت کاربران
     */

    let users = [];

    try {

      users =
        await getUsers();

    } catch (_) {

      users = [];

    }


    const userList =
      Array.isArray(users)
        ? users
        : [];


    /*
     * Map کاربران
     */

    const byId =
      new Map();

    const byTelegram =
      new Map();


    for (
      const user of userList
    ) {

      if (
        user?.id !== null &&
        user?.id !== undefined
      ) {

        byId.set(
          String(user.id),
          user
        );

      }


      if (
        user?.telegram_id !== null &&
        user?.telegram_id !== undefined
      ) {

        byTelegram.set(
          String(user.telegram_id),
          user
        );

      }

    }


    /*
     * ترکیب Receipt + User
     */

    const enriched =
      (
        Array.isArray(receipts)
          ? receipts
          : []
      ).map(
        (receipt) => {

          const userById =
            receipt.user_id !== null &&
            receipt.user_id !== undefined
              ? byId.get(
                  String(
                    receipt.user_id
                  )
                )
              : null;


          const userByTelegram =
            receipt.telegram_id !== null &&
            receipt.telegram_id !== undefined
              ? byTelegram.get(
                  String(
                    receipt.telegram_id
                  )
                )
              : null;


          const user =
            userById ||
            userByTelegram ||
            null;


          return {

            ...receipt,


            telegram_id:
              receipt.telegram_id ||
              user?.telegram_id ||
              "",


            username:
              receipt.username ||
              user?.username ||
              "",


            first_name:
              receipt.first_name ||
              user?.first_name ||
              "",


            last_name:
              receipt.last_name ||
              user?.last_name ||
              "",


            account_status:
              user?.account_status ||
              "inactive"

          };

        }
      );


    return res.json({

      success: true,

      receipts:
        enriched

    });


  } catch (error) {

    console.error(
      "ADMIN RECEIPTS ERROR:",
      error
    );

    return res
      .status(
        error.status || 500
      )
      .json({

        success: false,

        error:
          error.message ||
          "Failed to load receipts.",

        details:
          error.details ||
          null

      });

  }

}


/*
=========================================================
ADMIN REVIEW
=========================================================
*/

async function adminReview(
  req,
  res
) {

  if (!authorized(req)) {

    return res
      .status(401)
      .json({
        success: false,
        error:
          "Unauthorized."
      });

  }


  const receiptId =
    String(
      req.body?.receiptId ||
      ""
    ).trim();


  const status =
    String(
      req.body?.status ||
      ""
    ).trim();


  if (
    !receiptId ||
    ![
      "approved",
      "rejected"
    ].includes(status)
  ) {

    return res
      .status(400)
      .json({

        success: false,

        error:
          "receiptId and a valid status are required."

      });

  }


  try {

    /*
     * پیدا کردن رسید
     */

    const found =
      await supabaseRequest(
        `receipts?id=eq.${encodeURIComponent(
          receiptId
        )}&select=*`,
        {
          method: "GET"
        }
      );


    const receipt =
      Array.isArray(found)
        ? found[0]
        : null;


    if (!receipt) {

      return res
        .status(404)
        .json({

          success: false,

          error:
            "Receipt not found."

        });

    }


    /*
     * ==================================================
     * بروزرسانی وضعیت رسید
     *
     * reviewed_at عمداً وجود ندارد.
     * ==================================================
     */

    const updatedReceipt =
      await supabaseRequest(
        `receipts?id=eq.${encodeURIComponent(
          receiptId
        )}`,
        {

          method: "PATCH",

          body:
            JSON.stringify({
              status:
                status
            }),

          prefer:
            "return=representation"

        }
      );


    /*
     * ==================================================
     * پیدا کردن کاربر
     * ==================================================
     */

    let userUpdate = [];

    let userFilter = "";


    if (
      receipt.user_id !== null &&
      receipt.user_id !== undefined &&
      String(receipt.user_id).trim()
    ) {

      userFilter =
        `id=eq.${encodeURIComponent(
          receipt.user_id
        )}`;

    } else if (
      receipt.telegram_id !== null &&
      receipt.telegram_id !== undefined &&
      String(receipt.telegram_id).trim()
    ) {

      userFilter =
        `telegram_id=eq.${encodeURIComponent(
          String(
            receipt.telegram_id
          )
        )}`;

    }


    /*
     * ==================================================
     * فعال / غیرفعال کردن حساب
     * ==================================================
     */

    if (userFilter) {

      userUpdate =
        await supabaseRequest(
          `users?${userFilter}`,
          {

            method: "PATCH",

            body:
              JSON.stringify({

                account_status:
                  status ===
                  "approved"
                    ? "active"
                    : "inactive",

                updated_at:
                  new Date()
                    .toISOString()

              }),

            prefer:
              "return=representation"

          }
        );

    }


    return res.json({

      success: true,

      message:
        status === "approved"
          ? "Receipt approved."
          : "Receipt rejected.",

      receipt:
        Array.isArray(
          updatedReceipt
        )
          ? updatedReceipt[0]
          : updatedReceipt,

      user:
        Array.isArray(
          userUpdate
        )
          ? userUpdate[0] ||
            null
          : userUpdate

    });


  } catch (error) {

    console.error(
      "ADMIN REVIEW ERROR:",
      error
    );

    return res
      .status(
        error.status || 500
      )
      .json({

        success: false,

        error:
          error.message ||
          "Review failed.",

        details:
          error.details ||
          null

      });

  }

}


/*
=========================================================
ADMIN ROUTES
=========================================================
*/

const receiptsMiddleware =
  (
    req,
    res,
    next
  ) =>
    adminReceipts(
      req,
      res,
      next
    );


const reviewMiddleware =
  (
    req,
    res,
    next
  ) =>
    adminReview(
      req,
      res,
      next
    );


app.use(
  "/api/admin/receipts-v2",
  receiptsMiddleware
);


app.use(
  "/api/admin/review",
  reviewMiddleware
);


/*
=========================================================
MOVE ADMIN ROUTES TO TOP
=========================================================
*/

const stack =
  app._router?.stack;


if (
  Array.isArray(stack)
) {

  const moveFirst =
    (middleware) => {

      const index =
        stack.findIndex(
          layer =>
            layer.handle ===
            middleware
        );


      if (
        index > -1
      ) {

        const layer =
          stack.splice(
            index,
            1
          )[0];


        stack.unshift(
          layer
        );

      }

    };


  moveFirst(
    receiptsMiddleware
  );


  moveFirst(
    reviewMiddleware
  );

}


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = app;
