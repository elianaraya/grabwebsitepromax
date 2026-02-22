const csv = require("csvtojson");
const Order = require("../models/Order");

exports.uploadCsvController = async (req, res) => {
  try {
    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).json({ success: false, message: "Invitation code missing" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file missing" });
    }

    const jsonArray = await csv().fromFile(req.file.path);

    if (!jsonArray.length) {
      return res.status(400).json({ success: false, message: "CSV file is empty" });
    }

    const platform = jsonArray[0].platform;

    const lastOrder = await Order.findOne({ platform, invitationCode })
      .sort({ orderIndex: -1 });

    let index = lastOrder ? lastOrder.orderIndex + 1 : 1;

    for (let row of jsonArray) {

      const orderType = (row.orderType || "single").toLowerCase();

      // ================= SINGLE =================
      if (orderType === "single") {

        if (!row.image || row.image.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Single order must have 1 image",
          });
        }

        const img = row.image.trim();

        const fixedImage = img.startsWith("http")
          ? img
          : `${req.protocol}://${req.get("host")}/uploads/orders/${img}`;

        await Order.create({
          platform: row.platform,
          title: row.title,
          amount: Number(row.amount),
          commission: Number(row.commission),
          totalProfit: Number(row.totalProfit),
          orderType: "single",
          image: fixedImage,
          images: [],
          invitationCode,
          orderIndex: index++,
          status: "active",
        });
      }

      // ================= COMBINE =================
      else if (orderType === "combine") {

        if (!row.images) {
          return res.status(400).json({
            success: false,
            message: "Combine order must have 5 images",
          });
        }

        const imagesArray = row.images
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img !== "");

        if (imagesArray.length !== 5) {
          return res.status(400).json({
            success: false,
            message: "Combine order must contain exactly 5 images",
          });
        }

        const fixedImages = imagesArray.map((img) =>
          img.startsWith("http")
            ? img
            : `${req.protocol}://${req.get("host")}/uploads/orders/${img}`
        );

        await Order.create({
          platform: row.platform,
          title: row.title,
          amount: Number(row.amount),
          commission: Number(row.commission),
          totalProfit: Number(row.totalProfit),
          orderType: "combine",
          image: "",
          images: fixedImages,
          invitationCode,
          orderIndex: index++,
          status: "active",
        });
      }

      else {
        return res.status(400).json({
          success: false,
          message: "Invalid orderType (must be single or combine)",
        });
      }
    }

    return res.json({
      success: true,
      message: "CSV uploaded successfully (Single + Combine mixed supported)",
    });

  } catch (err) {
    console.log("CSV Upload Error:", err);
    return res.status(500).json({ success: false, message: "CSV upload failed" });
  }
};
