import { prisma } from '../config/db.js';

// ייצוא מפורש של הפונקציות (Export)
export const getAllUsersService = async () => {
  return await prisma.user.findMany();
};

export const createUserService = async (email: string, name?: string) => {
  return await prisma.user.create({
    data: { email, name },
  });
};