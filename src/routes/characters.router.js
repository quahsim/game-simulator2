import express from 'express';
import { prisma } from '../utils/prisma/index.js'; 
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Modified authMiddleware to not block unauthenticated requests
const optionalAuthMiddleware = (req, res, next) => {
  if (req.cookies.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
};

/** Create Character API **/
router.post('/characters', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Ensure the user exists
    const existingUser = await prisma.users.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a character with the same name already exists
    const existingCharacter = await prisma.characters.findFirst({
      where: {
        name,
      },
    });

    if (existingCharacter) {
      return res.status(400).json({ message: 'Character name is already in use' });
    }

    // Find user's character & get the current amount of money for the user's character
    const character = await prisma.characters.findFirst({
      where: { userId },
      select: { money: true },
    });

    // Calculate the new amount of money for the user's character
    const newMoney = character.money + 10000;

    // Create the new character with the updated money value
    const newCharacter = await prisma.characters.create({
      data: {
        userId,
        name,
        money: newMoney,
      },
    });

    // Update money for all characters
    await prisma.characters.updateMany({
      where: { NOT: { characterId: newCharacter.characterId } }, // Exclude the newly created character
      data: {
        money: {
          increment: 10000,
        },
      },
    });

    return res.status(201).json({ 
      message: 'Character successfully created!', characterId: newCharacter.characterId });
  } catch (error) {
    return next(error);
  }
});


/** Character Details API **/
router.get('/characters/:characterId', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { characterId } = req.params;
    const userId = req.user ? req.user.userId : null;

    // Find character details by characterId
    const characterDetails = await prisma.characters.findFirst({
      where: {
        characterId: +characterId,
      },
      select: {
        name: true,
        health: true,
        power: true,
        userId: true, 
        money: true, 
      },
    });

    // If character with specified characterId does not exist
    if (!characterDetails) {
      return res.status(404).json({ message: "Character not found. Please check Character Id." });
    }

    // If user is logged in and the character belongs to the logged-in user
    if (userId && characterDetails.userId === userId) {
      const { name, health, power, money } = characterDetails;
      return res.status(200).json({ name, health, power, money });
    } else {
      // If user is NOT logged in or character does not belong to logged-in user
      const { name, health, power } = characterDetails;
      return res.status(200).json({ name, health, power });
    }
  } catch (error) {
    return next(error);
  }
});
  
/** Delete Character **/
router.delete("/characters/:characterId", authMiddleware, async (req, res, next) => {
    const { characterId } = req.params;
    const{userId}=req.user; 
  
    try {
     //Find the character by characterId first!
      const character = await prisma.characters.findFirst ({
        where: {
          characterId: +characterId,
        },
      });
  
      // If character is not found, return message
      if (!character) {
        return res.status(404).json({ errorMessage: "Character not found." });
      }

      //Verify that the character belongs to the logged-in user
      if(character.userId !==userId){
        return res.status(403).json({errorMessage:"You do not have permission to delete this character."})
      }

      //Delete the character
      await prisma.characters.delete({
        where:{
            characterId:+characterId,
        },
      });
     
      return res.status(200).json({ message: "Character successfully deleted!" });
    } catch (error) {
      next(error);
    }
  });
  

export default router;