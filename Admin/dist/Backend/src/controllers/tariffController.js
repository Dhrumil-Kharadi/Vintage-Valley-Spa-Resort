"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTariff = exports.getTariffs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
const getTariffs = async (req, res) => {
    try {
        let tariffs = await prisma.tariff.findMany();
        if (tariffs.length === 0) {
            await prisma.tariff.createMany({
                data: DEFAULT_TARIFFS
            });
            tariffs = await prisma.tariff.findMany();
        }
        res.json({ ok: true, data: { tariffs } });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: { message: err.message } });
    }
};
exports.getTariffs = getTariffs;
const updateTariff = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, mealPlan, persons, weekday, weekend } = req.body;
        const updated = await prisma.tariff.update({
            where: { id: parseInt(id, 10) },
            data: { category, mealPlan, persons, weekday, weekend }
        });
        res.json({ ok: true, data: { tariff: updated } });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: { message: err.message } });
    }
};
exports.updateTariff = updateTariff;
