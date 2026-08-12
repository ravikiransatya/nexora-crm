import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

async function main() {
  console.log("Seeding Nexora ERP demo data...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@nexora.demo" },
      update: { name: "Ravi" },
      create: { name: "Ravi", email: "admin@nexora.demo", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@nexora.demo" },
      update: { name: "Kiran" },
      create: { name: "Kiran", email: "sales@nexora.demo", passwordHash, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@nexora.demo" },
      update: { name: "Satya" },
      create: { name: "Satya", email: "warehouse@nexora.demo", passwordHash, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@nexora.demo" },
      update: { name: "Tulasi" },
      create: { name: "Tulasi", email: "accounts@nexora.demo", passwordHash, role: "ACCOUNTS" },
    }),
  ]);

  const categoryNames = ["Electricals", "Hardware", "Stationery", "Kitchenware", "Plumbing"];
  const categories = await Promise.all(
    categoryNames.map((name) => prisma.category.upsert({ where: { name }, update: {}, create: { name } }))
  );

  const warehouseNames = [
    { name: "Vadodara Main Warehouse", location: "GIDC Makarpura, Vadodara" },
    { name: "Ahmedabad Distribution Hub", location: "Naroda Industrial Estate, Ahmedabad" },
  ];
  const warehouses = await Promise.all(
    warehouseNames.map((w) =>
      prisma.warehouse.upsert({ where: { name: w.name }, update: {}, create: w })
    )
  );

  const productDefs = [
    { name: "LED Bulb 9W", sku: "SKU-1001", category: 0, price: 85, stock: 500, min: 100 },
    { name: "LED Tube Light 20W", sku: "SKU-1002", category: 0, price: 220, stock: 300, min: 60 },
    { name: "Ceiling Fan 1200mm", sku: "SKU-1003", category: 0, price: 1450, stock: 40, min: 10 },
    { name: "Extension Board 6-Socket", sku: "SKU-1004", category: 0, price: 350, stock: 5, min: 20 },
    { name: "MCB 32A", sku: "SKU-1005", category: 0, price: 180, stock: 0, min: 15 },
    { name: "Claw Hammer 500g", sku: "SKU-2001", category: 1, price: 245, stock: 80, min: 20 },
    { name: "Measuring Tape 5m", sku: "SKU-2002", category: 1, price: 120, stock: 150, min: 30 },
    { name: "Screwdriver Set (6pc)", sku: "SKU-2003", category: 1, price: 399, stock: 60, min: 15 },
    { name: "Cable Tie Pack (100pc)", sku: "SKU-2004", category: 1, price: 90, stock: 200, min: 40 },
    { name: "A4 Copier Paper Ream", sku: "SKU-3001", category: 2, price: 260, stock: 400, min: 80 },
    { name: "Gel Pen Box (10pc)", sku: "SKU-3002", category: 2, price: 150, stock: 250, min: 50 },
    { name: "Stainless Steel Kadai 3L", sku: "SKU-4001", category: 3, price: 890, stock: 35, min: 10 },
    { name: "Non-Stick Tawa 28cm", sku: "SKU-4002", category: 3, price: 650, stock: 45, min: 10 },
    { name: "PVC Pipe 1inch (3m)", sku: "SKU-5001", category: 4, price: 210, stock: 120, min: 25 },
    { name: "Brass Tap Fitting", sku: "SKU-5002", category: 4, price: 480, stock: 8, min: 15 },
  ];

  const products = [];
  for (const [i, p] of productDefs.entries()) {
    const stockStatus = p.stock <= 0 ? "OUT_OF_STOCK" : p.stock <= p.min ? "LOW_STOCK" : "HEALTHY";
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        categoryId: categories[p.category].id,
        warehouseId: warehouses[i % warehouses.length].id,
        unitPrice: new Prisma.Decimal(p.price),
        stock: p.stock,
        minStock: p.min,
        stockStatus: stockStatus as any,
      },
    });
    products.push(product);
  }

  const customerDefs = [
    { name: "Kiran Traders", mobile: "9825011111", business: "Kiran Traders", type: "WHOLESALE", status: "ACTIVE", gst: "24AACCK1234F1Z5" },
    { name: "Patel Hardware Store", mobile: "9825022222", business: "Patel Hardware", type: "RETAIL", status: "ACTIVE", gst: null },
    { name: "Shreeji Distributors", mobile: "9825033333", business: "Shreeji Distributors", type: "DISTRIBUTOR", status: "ACTIVE", gst: "24AACCS5678G1Z2" },
    { name: "Om Electricals", mobile: "9825044444", business: "Om Electricals", type: "RETAIL", status: "LEAD", gst: null },
    { name: "Bansal Enterprises", mobile: "9825055555", business: "Bansal Enterprises", type: "WHOLESALE", status: "ACTIVE", gst: "24AACCB4321H1Z9" },
    { name: "Modern Kitchenware Co.", mobile: "9825066666", business: "Modern Kitchenware", type: "RETAIL", status: "INACTIVE", gst: null },
    { name: "Sundar Plumbing Supplies", mobile: "9825077777", business: "Sundar Plumbing", type: "WHOLESALE", status: "ACTIVE", gst: "24AACCS8765J1Z3" },
    { name: "Anand Stationery Mart", mobile: "9825088888", business: "Anand Stationery", type: "RETAIL", status: "LEAD", gst: null },
    { name: "Vishal Distributors", mobile: "9825099999", business: "Vishal Distributors", type: "DISTRIBUTOR", status: "ACTIVE", gst: "24AACCV2468K1Z7" },
    { name: "Nikhil General Store", mobile: "9825010101", business: "Nikhil General Store", type: "RETAIL", status: "ACTIVE", gst: null },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    const customer =
      existing ??
      (await prisma.customer.create({
        data: {
          name: c.name,
          mobile: c.mobile,
          businessName: c.business,
          customerType: c.type as any,
          status: c.status as any,
          gstNumber: c.gst ?? undefined,
          address: "Vadodara, Gujarat, India",
          followUpDate: c.status === "LEAD" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined,
        },
      }));
    customers.push(customer);
  }

  // A few follow-up notes
  await prisma.customerFollowup.createMany({
    data: [
      { customerId: customers[3].id, note: "Called to discuss bulk LED order, awaiting quote approval.", createdById: sales.id },
      { customerId: customers[7].id, note: "Sent stationery catalog, follow up next week.", createdById: sales.id },
      { customerId: customers[0].id, note: "Confirmed monthly wholesale rate card.", createdById: sales.id },
    ],
  });

  // Some manual stock movements (initial stock-in history)
  for (const p of products.slice(0, 6)) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        quantity: 50,
        type: "IN",
        reason: "Initial stock receipt from supplier",
        createdById: warehouse.id,
      },
    });
  }

  // A confirmed challan (with real stock deduction applied at seed time)
  const sampleItems = [
    { product: products[0], qty: 10 },
    { product: products[2], qty: 2 },
  ];
  const totalQuantity = sampleItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = sampleItems.reduce(
    (s, i) => s.add(i.product.unitPrice.mul(i.qty)),
    new Prisma.Decimal(0)
  );

  const existingChallan = await prisma.challan.findUnique({ where: { challanNumber: "CH-2026-00001" } });
  if (!existingChallan) {
    await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.create({
        data: {
          challanNumber: "CH-2026-00001",
          customerId: customers[0].id,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          totalQuantity,
          totalAmount,
          createdById: sales.id,
          items: {
            create: sampleItems.map((i) => ({
              productId: i.product.id,
              productName: i.product.name,
              sku: i.product.sku,
              unitPrice: i.product.unitPrice,
              quantity: i.qty,
              subtotal: i.product.unitPrice.mul(i.qty),
            })),
          },
        },
      });

      for (const item of sampleItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.qty } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.product.id,
            quantity: item.qty,
            type: "OUT",
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdById: sales.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: sales.id,
          action: "CHALLAN_CONFIRMED",
          entity: "Challan",
          entityId: challan.id,
          description: `Challan ${challan.challanNumber} confirmed (seed data)`,
        },
      });
    });
  }

  // A draft challan too
  const draftExists = await prisma.challan.findUnique({ where: { challanNumber: "CH-2026-00002" } });
  if (!draftExists) {
    const item = products[9];
    await prisma.challan.create({
      data: {
        challanNumber: "CH-2026-00002",
        customerId: customers[1].id,
        status: "DRAFT",
        totalQuantity: 20,
        totalAmount: item.unitPrice.mul(20),
        createdById: sales.id,
        items: {
          create: [
            {
              productId: item.id,
              productName: item.name,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: 20,
              subtotal: item.unitPrice.mul(20),
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo users (password for all: %s):", DEMO_PASSWORD);
  console.log(" - admin@nexora.demo (ADMIN)");
  console.log(" - sales@nexora.demo (SALES)");
  console.log(" - warehouse@nexora.demo (WAREHOUSE)");
  console.log(" - accounts@nexora.demo (ACCOUNTS)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
