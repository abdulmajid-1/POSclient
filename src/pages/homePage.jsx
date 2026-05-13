import { useState } from "react";
import { FiBox, FiDollarSign, FiShoppingCart, FiTrendingUp } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
    { name: "Mon", sales: 400 },
    { name: "Tue", sales: 300 },
    { name: "Wed", sales: 500 },
    { name: "Thu", sales: 200 },
    { name: "Fri", sales: 600 },
    { name: "Sat", sales: 700 },
    { name: "Sun", sales: 450 },
];

export default function Homepage() {
    // Plain React JS (no TypeScript)
    const [stats] = useState({
        totalSales: 1240,
        revenue: 540000,
        products: 320,
        expenses: 120000,
    });

    const cards = [
        {
            title: "Total Sales",
            value: stats.totalSales,
            icon: <FiShoppingCart className="text-blue-500" />,
        },
        {
            title: "Revenue",
            value: `SAR ${stats.revenue}`,
            icon: <FiDollarSign className="text-green-500" />,
        },
        {
            title: "Products",
            value: stats.products,
            icon: <FiBox className="text-purple-500" />,
        },
        {
            title: "Expenses",
            value: `SAR ${stats.expenses}`,
            icon: <FiTrendingUp className="text-red-500" />,
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">AB Traders Dashboard</h1>
                <p className="text-gray-500">Welcome back, manage your business efficiently</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white shadow-md rounded-2xl p-4 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-gray-500 text-sm">{card.title}</p>
                            <h2 className="text-xl font-bold">{card.value}</h2>
                        </div>
                        <div className="text-3xl">{card.icon}</div>
                    </div>
                ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white p-4 rounded-2xl shadow-md">
                <h2 className="text-lg font-semibold mb-4">Weekly Sales Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="sales" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
