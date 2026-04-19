import { Router, type IRouter } from "express";
import { RationCard } from "@workspace/db";

const router: IRouter = Router();

// Search ration cards by partial card number
router.get("/ration-cards/search", async (req, res): Promise<void> => {
  const { query } = req.query;
  
  if (!query || typeof query !== "string" || query.length < 3) {
    res.json([]);
    return;
  }
  
  try {
    const cards = await RationCard.find({
      rationCardNumber: { $regex: query, $options: "i" },
      isActive: true
    }).select("rationCardNumber holderName cardType").limit(10);
    
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

// Validate a specific ration card number
router.get("/ration-cards/validate/:cardNumber", async (req, res): Promise<void> => {
  const { cardNumber } = req.params;
  
  if (!cardNumber) {
    res.json({ 
      valid: false, 
      message: "Please enter a valid ration card number" 
    });
    return;
  }
  
  try {
    const card = await RationCard.findOne({
      rationCardNumber: cardNumber.toUpperCase(),
      isActive: true
    });
    
    if (!card) {
      res.json({ 
        valid: false, 
        message: "Please enter a valid ration card number" 
      });
      return;
    }

    const allowRegistered = req.query.allowRegistered === "true";
    
    // Check if card is already registered to a user
    const User = (await import("@workspace/db")).User;
    const existingUser = await User.findOne({ rationCardNumber: cardNumber });
    
    if (existingUser && !allowRegistered) {
      res.json({ 
        valid: false, 
        message: "This ration card is already registered" 
      });
      return;
    }
    
    res.json({ 
      valid: true, 
      message: `Valid ration card - ${card.holderName} (${card.cardType})`,
      holderName: card.holderName,
      cardType: card.cardType
    });
  } catch (error) {
    res.status(500).json({ message: "Validation failed" });
  }
});

// Get user's ration card details (protected route)
router.get("/ration-cards/my-card", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  
  try {
    const User = (await import("@workspace/db")).User;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const rationCard = await RationCard.findOne({ 
      rationCardNumber: user.rationCardNumber 
    });
    
    if (!rationCard) {
      res.status(404).json({ message: "Ration card not found" });
      return;
    }
    
    res.json(rationCard);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ration card details" });
  }
});

export default router;
