require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const User = require('../models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastewise';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const salt = await bcrypt.genSalt(10);

    const users = [
      // ── Admin ──────────────────────────────────────────────────
      {
        username: 'mcd_admin',
        email: 'admin@wastewise.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        profile: { firstName: 'MCD', lastName: 'Admin', phone: '9876543210', address: 'Delhi MCD HQ', zone: 'Central Delhi' },
        rewardPoints: 1000, level: 10, isVerified: true
      },
      // ── Collectors ─────────────────────────────────────────────
      {
        username: 'collector_raj',
        email: 'collector@wastewise.com',
        password: await bcrypt.hash('collector123', salt),
        role: 'collector',
        profile: { firstName: 'Raj', lastName: 'Kumar', phone: '9876543211', address: 'Zone 4 Depot', zone: 'South Delhi' },
        vehicleNumber: 'DL-01-AB-1234',
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        rewardPoints: 850, level: 7, isVerified: true
      },
      {
        username: 'collector_priya',
        email: 'collector2@wastewise.com',
        password: await bcrypt.hash('collector123', salt),
        role: 'collector',
        profile: { firstName: 'Priya', lastName: 'Singh', phone: '9876543221', address: 'Zone 2 Depot', zone: 'North Delhi' },
        vehicleNumber: 'DL-02-CD-5678',
        location: { type: 'Point', coordinates: [77.2195, 28.6315] },
        rewardPoints: 620, level: 5, isVerified: true
      },
      {
        username: 'collector_amit',
        email: 'collector3@wastewise.com',
        password: await bcrypt.hash('collector123', salt),
        role: 'collector',
        profile: { firstName: 'Amit', lastName: 'Verma', phone: '9876543231', address: 'Zone 7 Depot', zone: 'East Delhi' },
        vehicleNumber: 'DL-07-EF-9012',
        location: { type: 'Point', coordinates: [77.2798, 28.5284] },
        rewardPoints: 410, level: 4, isVerified: true
      },
      // ── Citizens – Green Park RWA ──────────────────────────────
      {
        username: 'citizen_rahul',
        email: 'citizen@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Rahul', lastName: 'Sharma', phone: '9876543212', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2065, 28.5588] },
        rewardPoints: 1240, level: 8, isVerified: true
      },
      {
        username: 'neha_green',
        email: 'neha@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Neha', lastName: 'Gupta', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2070, 28.5595] },
        rewardPoints: 980, level: 6, isVerified: true
      },
      {
        username: 'arun_green',
        email: 'arun@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Arun', lastName: 'Mehta', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2060, 28.5580] },
        rewardPoints: 750, level: 5, isVerified: true
      },
      // ── Citizens – Hauz Khas Enclave ───────────────────────────
      {
        username: 'kavya_hk',
        email: 'kavya@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Kavya', lastName: 'Nair', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2023, 28.5494] },
        rewardPoints: 1650, level: 9, isVerified: true
      },
      {
        username: 'rohan_hk',
        email: 'rohan@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Rohan', lastName: 'Kapoor', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2028, 28.5500] },
        rewardPoints: 1100, level: 7, isVerified: true
      },
      {
        username: 'sita_hk',
        email: 'sita@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Sita', lastName: 'Rao', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2018, 28.5488] },
        rewardPoints: 890, level: 6, isVerified: true
      },
      // ── Citizens – Lajpat Nagar Cooperative ───────────────────
      {
        username: 'deepak_lnc',
        email: 'deepak@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Deepak', lastName: 'Joshi', address: 'Lajpat Nagar, New Delhi', society: 'Lajpat Nagar Cooperative', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2432, 28.5677] },
        rewardPoints: 1380, level: 8, isVerified: true
      },
      {
        username: 'maya_lnc',
        email: 'maya@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Maya', lastName: 'Pandey', address: 'Lajpat Nagar, New Delhi', society: 'Lajpat Nagar Cooperative', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2440, 28.5685] },
        rewardPoints: 920, level: 6, isVerified: true
      },
      // ── Citizens – Connaught Place Residents ──────────────────
      {
        username: 'priti_cp',
        email: 'priti@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Priti', lastName: 'Agarwal', address: 'Connaught Place, New Delhi', society: 'CP Residents Association', zone: 'Central Delhi' },
        location: { type: 'Point', coordinates: [77.2195, 28.6315] },
        rewardPoints: 560, level: 4, isVerified: true
      },
      {
        username: 'suresh_cp',
        email: 'suresh@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Suresh', lastName: 'Bhatia', address: 'Connaught Place, New Delhi', society: 'CP Residents Association', zone: 'Central Delhi' },
        location: { type: 'Point', coordinates: [77.2200, 28.6320] },
        rewardPoints: 430, level: 3, isVerified: true
      },
      // ── Citizens – Dwarka Sector 7 ────────────────────────────
      {
        username: 'anita_dw7',
        email: 'anita@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Anita', lastName: 'Singh', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0592, 28.5922] },
        rewardPoints: 2100, level: 10, isVerified: true
      },
      {
        username: 'vikram_dw7',
        email: 'vikram@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Vikram', lastName: 'Chaudhary', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0580, 28.5910] },
        rewardPoints: 1750, level: 9, isVerified: true
      },
      {
        username: 'rekha_dw7',
        email: 'rekha@wastewise.com',
        password: await bcrypt.hash('citizen123', salt),
        role: 'citizen',
        profile: { firstName: 'Rekha', lastName: 'Tiwari', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0600, 28.5930] },
        rewardPoints: 1420, level: 8, isVerified: true
      }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Seeded demo user: ${userData.email} (${userData.role})`);
      }
    }
  } catch (err) {
    console.error('❌ Auto-seed error:', err.message);
  }
};

module.exports = seedUsers;

if (require.main === module) {
  seedUsers().then(() => process.exit(0));
}
