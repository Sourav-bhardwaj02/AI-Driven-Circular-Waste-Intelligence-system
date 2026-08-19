require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Grievance = require('../models/Grievance');
const WasteCollection = require('../models/WasteCollection');
const RewardTransaction = require('../models/RewardTransaction');

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
    const defaultPassword = await bcrypt.hash('admin123', salt);
    const citizenPassword = await bcrypt.hash('citizen123', salt);
    const collectorPassword = await bcrypt.hash('collector123', salt);
    const identifierPassword = await bcrypt.hash('identifier123', salt);

    const usersData = [
      // ── Admin ──────────────────────────────────────────────────
      {
        username: 'mcd_admin',
        email: 'admin@wastewise.com',
        password: defaultPassword,
        role: 'admin',
        profile: { firstName: 'MCD', lastName: 'Admin', phone: '9876543210', address: 'Delhi MCD HQ, Town Hall', zone: 'Central Delhi', badgeNumber: 'ADMIN-01' },
        rewardPoints: 1000, level: 10, isVerified: true
      },

      // ── Identifiers (Waste Verification Officers) ─────────────
      {
        username: 'identifier_vikram',
        email: 'identifier@wastewise.com',
        password: identifierPassword,
        role: 'identifier',
        profile: { firstName: 'Vikram', lastName: 'Das', phone: '9876543299', address: 'Zone 4 Waste Processing Center', zone: 'South Delhi', badgeNumber: 'ID-7842', facilityZone: 'Zone 4 Sorting Depot' },
        rewardPoints: 1450, level: 9, isVerified: true
      },
      {
        username: 'identifier_ananya',
        email: 'verifier@wastewise.com',
        password: identifierPassword,
        role: 'identifier',
        profile: { firstName: 'Ananya', lastName: 'Roy', phone: '9876543288', address: 'Central Circular Lab', zone: 'Central Delhi', badgeNumber: 'ID-5521', facilityZone: 'Central Recovery Hub' },
        rewardPoints: 1280, level: 8, isVerified: true
      },
      {
        username: 'identifier_karan',
        email: 'karan_verifier@wastewise.com',
        password: identifierPassword,
        role: 'identifier',
        profile: { firstName: 'Karan', lastName: 'Sethi', phone: '9876543277', address: 'West Delhi Resource Hub', zone: 'West Delhi', badgeNumber: 'ID-4419', facilityZone: 'West Delhi Circular Facility' },
        rewardPoints: 920, level: 7, isVerified: true
      },

      // ── Collectors ─────────────────────────────────────────────
      {
        username: 'collector_raj',
        email: 'collector@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: { firstName: 'Raj', lastName: 'Kumar', phone: '9876543211', address: 'Zone 4 Depot', zone: 'South Delhi' },
        vehicleNumber: 'DL-01-AB-1234',
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        rewardPoints: 1850, level: 9, isVerified: true
      },
      {
        username: 'collector_priya',
        email: 'collector2@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: { firstName: 'Priya', lastName: 'Singh', phone: '9876543221', address: 'Zone 2 Depot', zone: 'North Delhi' },
        vehicleNumber: 'DL-02-CD-5678',
        location: { type: 'Point', coordinates: [77.2195, 28.6315] },
        rewardPoints: 1420, level: 8, isVerified: true
      },
      {
        username: 'collector_harpreet',
        email: 'harpreet@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: { firstName: 'Harpreet', lastName: 'Gill', phone: '9876543241', address: 'Zone 5 Depot', zone: 'West Delhi' },
        vehicleNumber: 'DL-04-GH-3456',
        location: { type: 'Point', coordinates: [77.0592, 28.5922] },
        rewardPoints: 1210, level: 7, isVerified: true
      },
      {
        username: 'collector_manoj',
        email: 'manoj@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: { firstName: 'Manoj', lastName: 'Tiwari', phone: '9876543251', address: 'Zone 1 Depot', zone: 'Central Delhi' },
        vehicleNumber: 'DL-09-JK-7890',
        location: { type: 'Point', coordinates: [77.2150, 28.6280] },
        rewardPoints: 940, level: 6, isVerified: true
      },
      {
        username: 'collector_amit',
        email: 'collector3@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: { firstName: 'Amit', lastName: 'Verma', phone: '9876543231', address: 'Zone 7 Depot', zone: 'East Delhi' },
        vehicleNumber: 'DL-07-EF-9012',
        location: { type: 'Point', coordinates: [77.2798, 28.5284] },
        rewardPoints: 730, level: 5, isVerified: true
      },

      // ── Citizens – Dwarka Sector 7 ────────────────────────────
      {
        username: 'anita_dw7',
        email: 'anita@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Anita', lastName: 'Singh', phone: '9876543201', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0592, 28.5922] },
        rewardPoints: 2450, level: 10, isVerified: true
      },
      {
        username: 'vikram_dw7',
        email: 'vikram@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Vikram', lastName: 'Chaudhary', phone: '9876543202', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0580, 28.5910] },
        rewardPoints: 1980, level: 9, isVerified: true
      },
      {
        username: 'rekha_dw7',
        email: 'rekha@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Rekha', lastName: 'Tiwari', phone: '9876543203', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0600, 28.5930] },
        rewardPoints: 1620, level: 8, isVerified: true
      },
      {
        username: 'rohit_dw7',
        email: 'rohit_dw7@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Rohit', lastName: 'Bansal', phone: '9876543204', address: 'Dwarka Sector 7, New Delhi', society: 'Dwarka Sec-7 RWA', zone: 'West Delhi' },
        location: { type: 'Point', coordinates: [77.0570, 28.5905] },
        rewardPoints: 1250, level: 7, isVerified: true
      },

      // ── Citizens – Green Park RWA ──────────────────────────────
      {
        username: 'citizen_rahul',
        email: 'citizen@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Rahul', lastName: 'Sharma', phone: '9876543212', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2065, 28.5588] },
        rewardPoints: 2150, level: 9, isVerified: true
      },
      {
        username: 'neha_green',
        email: 'neha@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Neha', lastName: 'Gupta', phone: '9876543213', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2070, 28.5595] },
        rewardPoints: 1720, level: 8, isVerified: true
      },
      {
        username: 'arun_green',
        email: 'arun@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Arun', lastName: 'Mehta', phone: '9876543214', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2060, 28.5580] },
        rewardPoints: 1390, level: 7, isVerified: true
      },
      {
        username: 'sunita_green',
        email: 'sunita_green@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Sunita', lastName: 'Verma', phone: '9876543215', address: 'Green Park, New Delhi', society: 'Green Park RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2075, 28.5600] },
        rewardPoints: 980, level: 6, isVerified: true
      },

      // ── Citizens – Hauz Khas Enclave ───────────────────────────
      {
        username: 'kavya_hk',
        email: 'kavya@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Kavya', lastName: 'Nair', phone: '9876543216', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2023, 28.5494] },
        rewardPoints: 2310, level: 10, isVerified: true
      },
      {
        username: 'rohan_hk',
        email: 'rohan@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Rohan', lastName: 'Kapoor', phone: '9876543217', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2028, 28.5500] },
        rewardPoints: 1680, level: 8, isVerified: true
      },
      {
        username: 'sita_hk',
        email: 'sita@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Sita', lastName: 'Rao', phone: '9876543218', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2018, 28.5488] },
        rewardPoints: 1220, level: 7, isVerified: true
      },
      {
        username: 'tarun_hk',
        email: 'tarun_hk@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Tarun', lastName: 'Khurana', phone: '9876543219', address: 'Hauz Khas, New Delhi', society: 'Hauz Khas Enclave RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2030, 28.5510] },
        rewardPoints: 890, level: 6, isVerified: true
      },

      // ── Citizens – Vasant Kunj Sector C ───────────────────────
      {
        username: 'pooja_vk',
        email: 'pooja_vk@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Pooja', lastName: 'Deshmukh', phone: '9876543261', address: 'Vasant Kunj Sector C, New Delhi', society: 'Vasant Kunj Sector C RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.1520, 28.5280] },
        rewardPoints: 2040, level: 9, isVerified: true
      },
      {
        username: 'sameer_vk',
        email: 'sameer_vk@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Sameer', lastName: 'Malhotra', phone: '9876543262', address: 'Vasant Kunj Sector C, New Delhi', society: 'Vasant Kunj Sector C RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.1530, 28.5290] },
        rewardPoints: 1540, level: 8, isVerified: true
      },
      {
        username: 'divya_vk',
        email: 'divya_vk@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Divya', lastName: 'Sengupta', phone: '9876543263', address: 'Vasant Kunj Sector C, New Delhi', society: 'Vasant Kunj Sector C RWA', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.1510, 28.5270] },
        rewardPoints: 1110, level: 7, isVerified: true
      },

      // ── Citizens – Rohini Sector 14 ───────────────────────────
      {
        username: 'manish_rohini',
        email: 'manish_rohini@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Manish', lastName: 'Goyal', phone: '9876543271', address: 'Rohini Sector 14, New Delhi', society: 'Rohini Sector 14 Eco-Club', zone: 'North Delhi' },
        location: { type: 'Point', coordinates: [77.1230, 28.7180] },
        rewardPoints: 1910, level: 9, isVerified: true
      },
      {
        username: 'simran_rohini',
        email: 'simran_rohini@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Simran', lastName: 'Sethi', phone: '9876543272', address: 'Rohini Sector 14, New Delhi', society: 'Rohini Sector 14 Eco-Club', zone: 'North Delhi' },
        location: { type: 'Point', coordinates: [77.1240, 28.7190] },
        rewardPoints: 1480, level: 8, isVerified: true
      },
      {
        username: 'gaurav_rohini',
        email: 'gaurav_rohini@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Gaurav', lastName: 'Aggarwal', phone: '9876543273', address: 'Rohini Sector 14, New Delhi', society: 'Rohini Sector 14 Eco-Club', zone: 'North Delhi' },
        location: { type: 'Point', coordinates: [77.1220, 28.7170] },
        rewardPoints: 1040, level: 6, isVerified: true
      },

      // ── Citizens – Mayur Vihar Phase 1 ────────────────────────
      {
        username: 'prateek_mv',
        email: 'prateek_mv@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Prateek', lastName: 'Saxena', phone: '9876543281', address: 'Mayur Vihar Phase 1, New Delhi', society: 'Mayur Vihar Phase 1 Samiti', zone: 'East Delhi' },
        location: { type: 'Point', coordinates: [77.2930, 28.6080] },
        rewardPoints: 1780, level: 8, isVerified: true
      },
      {
        username: 'shilpa_mv',
        email: 'shilpa_mv@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Shilpa', lastName: 'Ghosh', phone: '9876543282', address: 'Mayur Vihar Phase 1, New Delhi', society: 'Mayur Vihar Phase 1 Samiti', zone: 'East Delhi' },
        location: { type: 'Point', coordinates: [77.2940, 28.6090] },
        rewardPoints: 1350, level: 7, isVerified: true
      },
      {
        username: 'vineet_mv',
        email: 'vineet_mv@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Vineet', lastName: 'Iyer', phone: '9876543283', address: 'Mayur Vihar Phase 1, New Delhi', society: 'Mayur Vihar Phase 1 Samiti', zone: 'East Delhi' },
        location: { type: 'Point', coordinates: [77.2920, 28.6070] },
        rewardPoints: 910, level: 6, isVerified: true
      },

      // ── Citizens – Lajpat Nagar Cooperative ───────────────────
      {
        username: 'deepak_lnc',
        email: 'deepak@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Deepak', lastName: 'Joshi', phone: '9876543291', address: 'Lajpat Nagar, New Delhi', society: 'Lajpat Nagar Cooperative', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2432, 28.5677] },
        rewardPoints: 1650, level: 8, isVerified: true
      },
      {
        username: 'maya_lnc',
        email: 'maya@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Maya', lastName: 'Pandey', phone: '9876543292', address: 'Lajpat Nagar, New Delhi', society: 'Lajpat Nagar Cooperative', zone: 'South Delhi' },
        location: { type: 'Point', coordinates: [77.2440, 28.5685] },
        rewardPoints: 1190, level: 7, isVerified: true
      },

      // ── Citizens – Connaught Place Residents ──────────────────
      {
        username: 'priti_cp',
        email: 'priti@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Priti', lastName: 'Agarwal', phone: '9876543293', address: 'Connaught Place, New Delhi', society: 'CP Residents Association', zone: 'Central Delhi' },
        location: { type: 'Point', coordinates: [77.2195, 28.6315] },
        rewardPoints: 890, level: 5, isVerified: true
      },
      {
        username: 'suresh_cp',
        email: 'suresh@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: { firstName: 'Suresh', lastName: 'Bhatia', phone: '9876543294', address: 'Connaught Place, New Delhi', society: 'CP Residents Association', zone: 'Central Delhi' },
        location: { type: 'Point', coordinates: [77.2200, 28.6320] },
        rewardPoints: 670, level: 4, isVerified: true
      }
    ];

    const seededUsersMap = {};

    // 1. Seed or Update Users
    for (const userData of usersData) {
      const user = await User.findOneAndUpdate(
        { email: userData.email },
        { $set: userData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      seededUsersMap[user.username] = user;
    }
    console.log(`✅ Seeded & verified ${Object.keys(seededUsersMap).length} real system users.`);

    // 2. Seed Real Waste Complaints & Grievances for Citizens
    const complaintsCount = await Complaint.countDocuments();
    if (complaintsCount < 20) {
      const sampleComplaints = [
        {
          citizen: 'anita_dw7',
          sector: 'Dwarka Sector 7, Block B',
          description: 'Recyclable cardboard and plastic packaging pile cleared at Society Gate 2',
          status: 'resolved',
          priority: 'medium',
          coords: [77.0592, 28.5922],
          collector: 'collector_harpreet'
        },
        {
          citizen: 'anita_dw7',
          sector: 'Dwarka Sector 7, Market Lane',
          description: 'Segregated wet organic waste bin full near local park',
          status: 'resolved',
          priority: 'high',
          coords: [77.0595, 28.5925],
          collector: 'collector_harpreet'
        },
        {
          citizen: 'vikram_dw7',
          sector: 'Dwarka Sector 7, Block D',
          description: 'Electronic waste collection request (Lithium batteries and chargers)',
          status: 'resolved',
          priority: 'high',
          coords: [77.0580, 28.5910],
          collector: 'collector_harpreet'
        },
        {
          citizen: 'citizen_rahul',
          sector: 'Green Park Main Market',
          description: 'Overflowing commercial waste bin near metro gate #3',
          status: 'resolved',
          priority: 'high',
          coords: [77.2065, 28.5588],
          collector: 'collector_raj'
        },
        {
          citizen: 'citizen_rahul',
          sector: 'Green Park Extension, Lane 4',
          description: 'Fallen dry leaves and garden organic biomass collected for composting',
          status: 'resolved',
          priority: 'low',
          coords: [77.2060, 28.5582],
          collector: 'collector_raj'
        },
        {
          citizen: 'neha_green',
          sector: 'Green Park RWA Central Garden',
          description: 'Community recycling bin for PET plastic bottles and aluminum cans',
          status: 'resolved',
          priority: 'medium',
          coords: [77.2070, 28.5595],
          collector: 'collector_raj'
        },
        {
          citizen: 'kavya_hk',
          sector: 'Hauz Khas Village Road',
          description: 'Glass bottle waste container cleared and sorted for glass plant processing',
          status: 'resolved',
          priority: 'medium',
          coords: [77.2023, 28.5494],
          collector: 'collector_raj'
        },
        {
          citizen: 'kavya_hk',
          sector: 'Hauz Khas Enclave Gate 1',
          description: 'Wet waste segregation point inspection and bin replacement',
          status: 'resolved',
          priority: 'low',
          coords: [77.2025, 28.5498],
          collector: 'collector_raj'
        },
        {
          citizen: 'pooja_vk',
          sector: 'Vasant Kunj Sector C, Pocket 9',
          description: 'Recyclable packaging material pickup from residential blocks',
          status: 'resolved',
          priority: 'medium',
          coords: [77.1520, 28.5280],
          collector: 'collector_raj'
        },
        {
          citizen: 'manish_rohini',
          sector: 'Rohini Sector 14, Main Avenue',
          description: 'Illegal plastic debris reported along sidewalk and removed',
          status: 'resolved',
          priority: 'high',
          coords: [77.1230, 28.7180],
          collector: 'collector_priya'
        },
        {
          citizen: 'prateek_mv',
          sector: 'Mayur Vihar Phase 1, Pocket 1',
          description: 'Overflowing wet waste bin at local vegetable market',
          status: 'resolved',
          priority: 'high',
          coords: [77.2930, 28.6080],
          collector: 'collector_amit'
        },
        {
          citizen: 'deepak_lnc',
          sector: 'Lajpat Nagar Central Market',
          description: 'Cardboard cartons and packaging pile gathered for circular paper recycling',
          status: 'resolved',
          priority: 'medium',
          coords: [77.2432, 28.5677],
          collector: 'collector_raj'
        },
        {
          citizen: 'priti_cp',
          sector: 'Connaught Place Outer Circle',
          description: 'Food court organic waste segregation check and collection',
          status: 'in_progress',
          priority: 'medium',
          coords: [77.2195, 28.6315],
          collector: 'collector_manoj'
        }
      ];

      for (const comp of sampleComplaints) {
        const citizenUser = seededUsersMap[comp.citizen];
        const collectorUser = seededUsersMap[comp.collector];
        if (citizenUser) {
          await Complaint.create({
            citizenId: citizenUser._id,
            sector: comp.sector,
            description: comp.description,
            status: comp.status,
            priority: comp.priority,
            location: { type: 'Point', coordinates: comp.coords },
            assignedTo: collectorUser ? collectorUser._id : null,
            resolvedAt: comp.status === 'resolved' ? new Date(Date.now() - 1000 * 3600 * 24 * Math.floor(Math.random() * 10 + 1)) : null
          });
        }
      }
      console.log('✅ Seeded real complaints and citizen reports.');
    }

    // 3. Seed Real Waste Collections for Municipal Collectors
    const collectionsCount = await WasteCollection.countDocuments();
    if (collectionsCount < 15) {
      const sampleCollections = [
        { collector: 'collector_raj', area: 'South Delhi - Green Park & Hauz Khas', route: 'Route S-01 (Green Park)', dry: 420, wet: 850, haz: 25, pts: 120 },
        { collector: 'collector_raj', area: 'South Delhi - Vasant Kunj & Saket', route: 'Route S-02 (Vasant Kunj)', dry: 380, wet: 720, haz: 15, pts: 110 },
        { collector: 'collector_priya', area: 'North Delhi - Rohini & Pitampura', route: 'Route N-01 (Rohini Sec 14)', dry: 510, wet: 930, haz: 40, pts: 150 },
        { collector: 'collector_priya', area: 'North Delhi - Model Town & Civil Lines', route: 'Route N-02 (Model Town)', dry: 340, wet: 610, haz: 10, pts: 95 },
        { collector: 'collector_harpreet', area: 'West Delhi - Dwarka Sector 7 & 10', route: 'Route W-01 (Dwarka Central)', dry: 620, wet: 1100, haz: 55, pts: 180 },
        { collector: 'collector_harpreet', area: 'West Delhi - Janakpuri & Rajouri', route: 'Route W-02 (Janakpuri)', dry: 430, wet: 800, haz: 30, pts: 130 },
        { collector: 'collector_manoj', area: 'Central Delhi - Connaught Place & Paharganj', route: 'Route C-01 (CP Radial)', dry: 390, wet: 740, haz: 20, pts: 115 },
        { collector: 'collector_amit', area: 'East Delhi - Mayur Vihar & Laxmi Nagar', route: 'Route E-01 (Mayur Vihar)', dry: 480, wet: 890, haz: 35, pts: 140 }
      ];

      for (const col of sampleCollections) {
        const colUser = seededUsersMap[col.collector];
        if (colUser) {
          await WasteCollection.create({
            collectorId: colUser._id,
            area: col.area,
            route: col.route,
            status: 'completed',
            wasteTypes: [
              { type: 'dry', amount: col.dry },
              { type: 'wet', amount: col.wet },
              { type: 'hazardous', amount: col.haz }
            ],
            location: colUser.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
            completedAt: new Date(Date.now() - 1000 * 3600 * 12 * Math.floor(Math.random() * 7 + 1)),
            rewardPoints: col.pts,
            notes: `Cleared ${col.dry + col.wet + col.haz} kg of verified segregated municipal waste`
          });
        }
      }
      console.log('✅ Seeded real collector waste collection logs.');
    }

    // 4. Seed Reward Transactions for all citizens & collectors
    const txCount = await RewardTransaction.countDocuments();
    if (txCount < 30) {
      const txTemplates = [
        { desc: 'TACO AI Automated Waste Classification', pts: 50, cat: 'proper_disposal' },
        { desc: 'Wet & Dry Waste Segregation Audit', pts: 35, cat: 'proper_disposal' },
        { desc: 'Weekly Neighborhood Cleanliness Report', pts: 100, cat: 'weekly_report' },
        { desc: 'Daily Door-to-Door Waste Collection', pts: 75, cat: 'daily_pickup' },
        { desc: 'Optimized Green Route Completion', pts: 120, cat: 'route_optimization' }
      ];

      for (const [uname, user] of Object.entries(seededUsersMap)) {
        if (user.role === 'citizen' || user.role === 'collector' || user.role === 'identifier') {
          for (let i = 0; i < 3; i++) {
            const template = txTemplates[(uname.length + i) % txTemplates.length];
            await RewardTransaction.create({
              userId: user._id,
              type: 'earned',
              amount: template.pts,
              description: template.desc,
              category: template.cat,
              createdAt: new Date(Date.now() - 1000 * 3600 * 24 * (i * 3 + 1))
            });
          }
        }
      }
      console.log('✅ Seeded reward transaction histories for leaderboard members.');
    }

  } catch (err) {
    console.error('❌ Auto-seed error:', err.message || err);
  }
};

module.exports = seedUsers;

if (require.main === module) {
  seedUsers().then(() => process.exit(0));
}
