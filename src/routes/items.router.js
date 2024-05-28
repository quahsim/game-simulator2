import express from 'express';
import { prisma } from '../utils/prisma/index.js'; 


const router = express.Router();

/** Create Item API **/
router.post('/items', async (req, res, next) => {
    const { itemCode, itemName, itemStat, itemPrice } = req.body;

    try {
        // Validate input
        if (!itemCode || !itemName || !itemStat || !itemPrice) {
            return res.status(400).json({ message: "Item Code, Item Name, Item Stats, Item Price are required" });
        }

        const existingItem = await prisma.items.findUnique({
            where: {
                itemCode: itemCode,
            },
        });

        if (existingItem) {
            return res.status(409).json({ message: "Item Code already exists" });
        }

        // Create new item
        const newItem = await prisma.items.create({
            data: {
                itemCode,
                itemName,
                itemStat,
                itemPrice
            },
        });

        return res.status(201).json({ message: `${itemName} has successfully been created!` });
    } catch (error) {
        console.error("Error creating item:", error);
        return res.status(500).json({ message: "An error occurred while creating the item." });
    }
});

    
/** Update Item API **/
router.patch('/items/:itemCode',async (req,res,next)=>{
  const { itemCode } = req.params;
  const {itemName, itemStat}= req.body;

  try {
    const currentItem = await prisma.items.findFirst({ 
        where:{itemCode: +itemCode},
    });

    if (!currentItem) {
      return res.status(404).json({ errorMessage: "Item not found" });
    };

    await prisma.items.update({
        where:{itemCode: +itemCode},
          data: {
            itemName,
            itemStat 
          },
        });

    return res.status(200).json({ message: "Item updated successfully", itemName, itemStat });
  } catch (error) {
    next(error);
  }
});

/** Items Full List API **/
router.get('/items', async (req, res, next) => {
    try {
        const items = await prisma.items.findMany({
            select: {
                itemCode: true,
                itemName: true,
                itemPrice: true
            },
            orderBy: {
                itemCode: 'asc'
            }
        });

        return res.status(200).json({ data: items });
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ errorMessage: "An error occurred while fetching items." });
    }
});

/** Item Details API **/
router.get('/items/:itemCode',async(req,res,next)=>{
    const {itemCode}=req.params;
    const item = await prisma.items.findFirst({
        where:{
            itemCode:+itemCode
        },
        select:{
            itemCode:true,
            itemName:true,
            itemStat:true,
            itemPrice:true
        },
    });
    
    return res.status(200).json({data:item})
})

export default router;
