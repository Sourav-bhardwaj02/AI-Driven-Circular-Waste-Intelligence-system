require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WasteCollection = require('../models/WasteCollection');
const Complaint = require('../models/Complaint');
const Route = require('../models/Route');
const RewardTransaction = require('../models/RewardTransaction');
const Grievance = require('../models/Grievance');

const seedData = async () => {
  try {
    // Connect to database with better error handling
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data with error handling
    const collections = [User, WasteCollection, Complaint, Route, RewardTransaction, Grievance];
    for (const model of collections) {
      try {
        await model.deleteMany({});
      } catch (error) {
        console.warn(`Warning: Could not clear ${model.modelName}:`, error.message);
      }
    }
    console.log('✅ Cleared existing data');

    // Create users with validation
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const collectorPassword = await bcrypt.hash('collector123', 10);
    const citizenPassword = await bcrypt.hash('citizen123', 10);
    
    let admin, citizen, collector;
    
    try {
      admin = await User.create({
        username: 'admin',
        email: 'admin@wastewise.com',
        password: adminPassword,
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+919876543210'
        },
        rewardPoints: 0,
        level: 1,
        isActive: true,
        isVerified: true
      });
      console.log('✅ Created admin user');
    } catch (error) {
      console.error('❌ Error creating admin:', error.message);
      throw error;
    }

    try {
      citizen = await User.create({
        username: 'citizen1',
        email: 'citizen@wastewise.com',
        password: citizenPassword,
        role: 'citizen',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+919876543211',
          address: 'Green Park, Delhi'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        rewardPoints: 1250,
        level: 3,
        isActive: true,
        isVerified: true
      });
      console.log('✅ Created citizen user');
    } catch (error) {
      console.error('❌ Error creating citizen:', error.message);
      throw error;
    }

    try {
      collector = await User.create({
        username: 'collector1',
        email: 'collector@wastewise.com',
        password: collectorPassword,
        role: 'collector',
        profile: {
          firstName: 'Rajesh',
          lastName: 'Kumar',
          phone: '+919876543212',
          address: 'Sector 11, Delhi'
        },
        location: {
          type: 'Point',
          coordinates: [77.2190, 28.6239]
        },
        rewardPoints: 2100,
        level: 4,
        isActive: true,
        isVerified: true
      });
      console.log('✅ Created collector user');
    } catch (error) {
      console.error('❌ Error creating collector:', error.message);
      throw error;
    }

    console.log('✅ Created users');

    // Create routes with error handling
    let route, additionalRoutes;
    
    try {
      route = await Route.create({
        routeCode: 'G-0923',
        name: 'South Delhi Central Route',
        areas: [
          { name: 'Sector 11', coordinates: [77.2090, 28.6139], estimatedTime: 15, priority: 'medium' },
          { name: 'Sector 12', coordinates: [77.2190, 28.6239], estimatedTime: 20, priority: 'medium' },
          { name: 'Green Park', coordinates: [77.2150, 28.6180], estimatedTime: 18, priority: 'high' },
          { name: 'Lajpat Nagar', coordinates: [77.2250, 28.6280], estimatedTime: 25, priority: 'medium' },
          { name: 'Mayur Vihar', coordinates: [77.2310, 28.6330], estimatedTime: 30, priority: 'low' }
        ],
        collectorId: collector._id,
        status: 'assigned',
        checkpoints: [
          { name: 'Sector 11 Market', coordinates: [77.2090, 28.6139], order: 1 },
          { name: 'Green Park Colony', coordinates: [77.2150, 28.6180], order: 2 },
          { name: 'Sector 12 Residential', coordinates: [77.2190, 28.6239], order: 3 },
          { name: 'Lajpat Nagar Market', coordinates: [77.2250, 28.6280], order: 4 },
          { name: 'Mayur Vihar Phase 1', coordinates: [77.2310, 28.6330], order: 5 }
        ],
        totalDistance: 15.5,
        estimatedDuration: 180,
        aiOptimized: true
      });
      
      // Create additional routes
      additionalRoutes = await Route.create([
        {
          routeCode: 'G-0924',
          name: 'West Delhi Route',
          areas: [
            { name: 'Punjabi Bagh', coordinates: [77.1810, 28.6710], estimatedTime: 20, priority: 'medium' },
            { name: 'Rajouri Garden', coordinates: [77.1130, 28.6350], estimatedTime: 25, priority: 'high' },
            { name: 'Dwarka', coordinates: [77.0430, 28.5710], estimatedTime: 35, priority: 'low' }
          ],
          collectorId: collector._id,
          status: 'assigned',
          checkpoints: [
            { name: 'Punjabi Bagh Market', coordinates: [77.1810, 28.6710], order: 1 },
            { name: 'Rajouri Garden Plaza', coordinates: [77.1130, 28.6350], order: 2 },
            { name: 'Dwarka Sector 10', coordinates: [77.0430, 28.5710], order: 3 }
          ],
          totalDistance: 18.2,
          estimatedDuration: 210,
          aiOptimized: true
        },
        {
          routeCode: 'G-0925',
          name: 'Central Delhi Route',
          areas: [
            { name: 'Connaught Place', coordinates: [77.2080, 28.6300], estimatedTime: 15, priority: 'high' },
            { name: 'Karol Bagh', coordinates: [77.1900, 28.6500], estimatedTime: 20, priority: 'medium' },
            { name: 'South Extension', coordinates: [77.2100, 28.5700], estimatedTime: 18, priority: 'medium' }
          ],
          collectorId: collector._id,
          status: 'assigned',
          checkpoints: [
            { name: 'Connaught Place', coordinates: [77.2080, 28.6300], order: 1 },
            { name: 'Karol Bagh Market', coordinates: [77.1900, 28.6500], order: 2 },
            { name: 'South Extension', coordinates: [77.2100, 28.5700], order: 3 }
          ],
          totalDistance: 12.8,
          estimatedDuration: 150,
          aiOptimized: true
        },
        {
          routeCode: 'G-0926',
          name: 'South Delhi Market Route',
          areas: [
            { name: 'Sarojini Nagar', coordinates: [77.2000, 28.5800], estimatedTime: 12, priority: 'low' },
            { name: 'Defence Colony', coordinates: [77.2300, 28.5900], estimatedTime: 15, priority: 'medium' }
          ],
          collectorId: collector._id,
          status: 'unassigned',
          checkpoints: [
            { name: 'Sarojini Nagar Market', coordinates: [77.2000, 28.5800], order: 1 },
            { name: 'Defence Colony Market', coordinates: [77.2300, 28.5900], order: 2 }
          ],
          totalDistance: 8.5,
          estimatedDuration: 90,
          aiOptimized: true
        }
      ]);
      console.log('✅ Created routes');
    } catch (error) {
      console.error('❌ Error creating routes:', error.message);
      throw error;
    }

    // Assign route to collector
    try {
      await User.findByIdAndUpdate(collector._id, { assignedRoute: route._id });
      console.log('✅ Assigned route to collector');
    } catch (error) {
      console.error('❌ Error assigning route:', error.message);
      throw error;
    }

    // Create waste collections with more realistic data
    try {
      const wasteCollections = await WasteCollection.create([
        {
          collectorId: collector._id,
          area: 'Sector 11 Market Complex',
          route: 'G-0923',
          status: 'completed',
          wasteTypes: [
            { type: 'dry', amount: 45 },
            { type: 'wet', amount: 35 },
            { type: 'hazardous', amount: 10 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          },
          completedAt: new Date(Date.now() - 30 * 60 * 1000),
          rewardPoints: 25
        },
        {
          collectorId: collector._id,
          area: 'Green Park Colony - Block A',
          route: 'G-0923',
          status: 'in_progress',
          wasteTypes: [
            { type: 'dry', amount: 30 },
            { type: 'hazardous', amount: 8 },
            { type: 'wet', amount: 25 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2150, 28.6180]
          },
          startedAt: new Date(Date.now() - 10 * 60 * 1000),
          rewardPoints: 30
        },
        {
          collectorId: collector._id,
          area: 'Sector 12 Residential Society',
          route: 'G-0923',
          status: 'pending',
          wasteTypes: [
            { type: 'wet', amount: 55 },
            { type: 'dry', amount: 20 },
            { type: 'hazardous', amount: 5 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2190, 28.6239]
          },
          rewardPoints: 20
        },
        {
          collectorId: collector._id,
          area: 'Lajpat Nagar Central Market',
          route: 'G-0923',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 40 },
            { type: 'wet', amount: 30 },
            { type: 'hazardous', amount: 15 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2250, 28.6280]
          },
          rewardPoints: 22
        },
        {
          collectorId: collector._id,
          area: 'Mayur Vihar Phase 1 - Community Center',
          route: 'G-0923',
          status: 'pending',
          wasteTypes: [
            { type: 'hazardous', amount: 12 },
            { type: 'dry', amount: 25 },
            { type: 'wet', amount: 8 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2310, 28.6330]
          },
          rewardPoints: 28
        },
        {
          collectorId: collector._id,
          area: 'Punjabi Bagh West Market',
          route: 'G-0924',
          status: 'pending',
          wasteTypes: [
            { type: 'wet', amount: 65 },
            { type: 'dry', amount: 35 },
            { type: 'hazardous', amount: 10 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.1810, 28.6710]
          },
          rewardPoints: 25
        },
        {
          collectorId: collector._id,
          area: 'Rajouri Garden Main Plaza',
          route: 'G-0924',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 50 },
            { type: 'wet', amount: 40 },
            { type: 'hazardous', amount: 20 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.1130, 28.6350]
          },
          rewardPoints: 24
        },
        {
          collectorId: collector._id,
          area: 'Dwarka Sector 10 - Society Complex',
          route: 'G-0924',
          status: 'pending',
          wasteTypes: [
            { type: 'wet', amount: 70 },
            { type: 'dry', amount: 30 },
            { type: 'hazardous', amount: 5 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.0430, 28.5710]
          },
          rewardPoints: 26
        },
        {
          collectorId: collector._id,
          area: 'Connaught Place - Inner Circle',
          route: 'G-0925',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 80 },
            { type: 'wet', amount: 45 },
            { type: 'hazardous', amount: 5 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2080, 28.6300]
          },
          rewardPoints: 35
        },
        {
          collectorId: collector._id,
          area: 'Karol Bagh Market Area',
          route: 'G-0925',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 60 },
            { type: 'wet', amount: 50 },
            { type: 'hazardous', amount: 10 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.1900, 28.6500]
          },
          rewardPoints: 28
        },
        {
          collectorId: collector._id,
          area: 'South Extension - Part 1',
          route: 'G-0925',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 45 },
            { type: 'wet', amount: 38 },
            { type: 'hazardous', amount: 12 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2100, 28.5700]
          },
          rewardPoints: 24
        },
        {
          collectorId: collector._id,
          area: 'Sarojini Nagar Market',
          route: 'G-0926',
          status: 'pending',
          wasteTypes: [
            { type: 'dry', amount: 55 },
            { type: 'wet', amount: 42 },
            { type: 'hazardous', amount: 8 }
          ],
          location: {
            type: 'Point',
            coordinates: [77.2000, 28.5800]
          },
          rewardPoints: 23
        }
      ]);
      console.log(`✅ Created ${wasteCollections.length} waste collections`);
    } catch (error) {
      console.error('❌ Error creating waste collections:', error.message);
      throw error;
    }

    // Store the waste collections for later use
    let createdWasteCollections = [];
    try {
      createdWasteCollections = await WasteCollection.find({ collectorId: collector._id });
    } catch (error) {
      console.warn('Warning: Could not fetch waste collections for reward transactions');
    }

    console.log('Created waste collections');

    // Create grievances and complaints with error handling
    try {
      const grievances = await Grievance.create([
        {
          citizenId: citizen._id,
          title: 'Waste not collected from Sector 11 main road',
          category: 'Missed Pickup',
          description: 'Waste not collected from Sector 11 main road for 3 days',
          location: 'Sector 11, Delhi',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          },
          status: 'Pending',
          priority: 3,
          assignedTo: collector._id
        },
        {
          citizenId: citizen._id,
          title: 'Overflowing dustbin near Green Park market',
          category: 'Overflow',
          description: 'Dustbin overflowing near Green Park market',
          location: 'Green Park, Delhi',
          coordinates: {
            type: 'Point',
            coordinates: [77.2150, 28.6180]
          },
          status: 'In Progress',
          priority: 2,
          assignedTo: collector._id
        }
      ]);
      console.log(`✅ Created ${grievances.length} grievances`);

      const complaints = await Complaint.create([
        {
          citizenId: citizen._id,
          sector: 'Sector 11',
          description: 'Garbage not collected from the main road',
          status: 'resolved',
          priority: 'medium',
          location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          },
          assignedTo: collector._id,
          resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          citizenId: citizen._id,
          sector: 'Sector 12',
          description: 'Dustbin damaged and needs replacement',
          status: 'pending',
          priority: 'high',
          location: {
            type: 'Point',
            coordinates: [77.2190, 28.6239]
          },
          assignedTo: collector._id
        }
      ]);
      console.log(`✅ Created ${complaints.length} complaints`);
    } catch (error) {
      console.error('❌ Error creating grievances/complaints:', error.message);
      throw error;
    }

    // Create reward transactions with error handling
    try {
      const rewardTransactions = await RewardTransaction.create([
        {
          userId: collector._id,
          type: 'earned',
          amount: 25,
          description: 'Waste collection from Sector 11 Market',
          category: 'daily_pickup',
          referenceId: createdWasteCollections[0]?._id,
          referenceModel: 'WasteCollection'
        },
        {
          userId: citizen._id,
          type: 'earned',
          amount: 50,
          description: 'Referral bonus for new user signup',
          category: 'daily_pickup'
        },
        {
          userId: collector._id,
          type: 'earned',
          amount: 100,
          description: 'Monthly performance bonus',
          category: 'route_optimization'
        }
      ]);
      console.log(`✅ Created ${rewardTransactions.length} reward transactions`);
    } catch (error) {
      console.error('❌ Error creating reward transactions:', error.message);
      throw error;
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: 3 (admin: admin@wastewise.com, citizen: citizen@wastewise.com, collector: collector@wastewise.com)`);
    console.log(`   Routes: 4 (G-0923, G-0924, G-0925, G-0926)`);
    console.log(`   Waste Collections: 12`);
    console.log(`   Grievances: 2`);
    console.log(`   Complaints: 2`);
    console.log(`   Reward Transactions: 3`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Admin: admin@wastewise.com / admin123`);
    console.log(`   Citizen: citizen@wastewise.com / citizen123`);
    console.log(`   Collector: collector@wastewise.com / collector123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the seed function
seedData();
