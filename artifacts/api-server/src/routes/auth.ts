import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { User } from "@workspace/db";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { name, address, email, password } = parsed.data;

  const existing = await User.findOne({ email });

  if (existing) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    address,
    email,
    password: hashedPassword,
    role: "user"
  });

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.status(201).json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    },
    message: "Registration successful",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (user.role !== "user") {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    },
    message: "Login successful",
  });
});

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });

  if (!user || user.role !== "admin") {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    },
    message: "Admin login successful",
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out successfully" });
});

export default router;
