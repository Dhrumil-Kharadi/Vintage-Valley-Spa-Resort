import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TARIFFS = [
  {
    category: 'DELUXE STUDIO SUITE',
    mealPlan: 'BREAKFAST INCLUDED',
    persons: '2 ADULTS',
    weekday: '4500/-',
    weekend: '5500/-'
  },
  {
    category: 'DELUXE EDGE VIEW',
    mealPlan: 'BREAKFAST INCLUDED',
    persons: '2 ADULTS',
    weekday: '5000/-',
    weekend: '6000/-'
  },
  {
    category: 'LOTUS FAMILY SUITE',
    mealPlan: 'BREAKFAST INCLUDED',
    persons: '4 ADULTS',
    weekday: '8000/-',
    weekend: '9000/-'
  },
  {
    category: 'PRESIDENTIAL SUITE',
    mealPlan: 'BREAKFAST INCLUDED',
    persons: '4 ADULTS',
    weekday: '9000/-',
    weekend: '10000/-'
  }
];

export const getTariffs = async (req: Request, res: Response) => {
  try {
    let tariffs = await prisma.tariff.findMany();

    if (tariffs.length === 0) {
      await prisma.tariff.createMany({
        data: DEFAULT_TARIFFS
      });
      tariffs = await prisma.tariff.findMany();
    }

    res.json({ ok: true, data: { tariffs } });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: { message: err.message } });
  }
};

export const updateTariff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, mealPlan, persons, weekday, weekend } = req.body;

    const updated = await prisma.tariff.update({
      where: { id: parseInt(id, 10) },
      data: { category, mealPlan, persons, weekday, weekend }
    });

    res.json({ ok: true, data: { tariff: updated } });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: { message: err.message } });
  }
};
