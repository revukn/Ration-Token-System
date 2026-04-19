import { RationCard } from "@workspace/db";
import { logger } from "./logger";

const sampleRationCards = [
  {
    rationCardNumber: "KA-BNG-2024-001",
    holderName: "Revanna",
    cardType: "BPL",
    familyMembers: [
      { name: "Revanna", age: 48, relation: "Self", aadhaarLast4: "4523" },
      { name: "Jayanthi Revanna", age: 43, relation: "Wife", aadhaarLast4: "7891" },
      { name: "Suresh Revanna", age: 22, relation: "Son", aadhaarLast4: "3456" },
      { name: "Geetha Revanna", age: 18, relation: "Daughter", aadhaarLast4: "6789" }
    ],
    address: "123 Main St, Bangalore North, Bangalore - 560001"
  },
  {
    rationCardNumber: "KA-BNG-2024-002",
    holderName: "Jayanth",
    cardType: "AAY",
    familyMembers: [
      { name: "Jayanth", age: 40, relation: "Self", aadhaarLast4: "1234" },
      { name: "Savitha Jayanth", age: 37, relation: "Wife", aadhaarLast4: "5678" },
      { name: "Rahul Jayanth", age: 15, relation: "Son", aadhaarLast4: "9012" },
      { name: "Divya Jayanth", age: 12, relation: "Daughter", aadhaarLast4: "3344" }
    ],
    address: "456 Oak Ave, Bangalore South, Bangalore - 560002"
  },
  {
    rationCardNumber: "KA-MYS-2024-003",
    holderName: "Basapa",
    cardType: "PHH",
    familyMembers: [
      { name: "Basapa", age: 55, relation: "Self", aadhaarLast4: "2345" },
      { name: "Kamala Basapa", age: 50, relation: "Wife", aadhaarLast4: "6780" },
      { name: "Ravi Basapa", age: 28, relation: "Son", aadhaarLast4: "1122" },
      { name: "Shanthi Basapa", age: 24, relation: "Daughter", aadhaarLast4: "4455" }
    ],
    address: "789 Pine Rd, Mysore - 570001"
  },
  {
    rationCardNumber: "KA-BNG-2024-120",
    holderName: "Pavithra",
    cardType: "BPL",
    familyMembers: [
      { name: "Pavithra", age: 24, relation: "Self", aadhaarLast4: "1111" },
      { name: "Vihana", age: 4, relation: "Daughter", aadhaarLast4: "2222" }
    ],
    address: "321 Elm St, Bangalore East, Bangalore - 560003"
  },
  {
    rationCardNumber: "KA-BNG-2024-005",
    holderName: "Harsha",
    cardType: "AAY",
    familyMembers: [
      { name: "Harsha", age: 27, relation: "Self", aadhaarLast4: "3333" },
      { name: "Yuthika", age: 25, relation: "Wife", aadhaarLast4: "4444" },
      { name: "Shaurya", age: 7, relation: "Son", aadhaarLast4: "5555" }
    ],
    address: "654 Maple Dr, Bangalore West, Bangalore - 560004"
  },
  {
    rationCardNumber: "KA-MYS-2024-006",
    holderName: "Latha",
    cardType: "PHH",
    familyMembers: [
      { name: "Latha", age: 35, relation: "Self", aadhaarLast4: "6666" },
      { name: "Ayush", age: 45, relation: "Husband", aadhaarLast4: "7777" },
      { name: "Mourya", age: 15, relation: "Son", aadhaarLast4: "8888" },
      { name: "Arushi", age: 8, relation: "Daughter", aadhaarLast4: "9999" }
    ],
    address: "987 Cedar Ln, Mysore - 570002"
  },
  {
    rationCardNumber: "KA-BNG-2024-007",
    holderName: "Ramesh",
    cardType: "BPL",
    familyMembers: [
      { name: "Ramesh", age: 42, relation: "Self", aadhaarLast4: "1357" },
      { name: "Sujata Ramesh", age: 38, relation: "Wife", aadhaarLast4: "2468" },
      { name: "Karthik Ramesh", age: 16, relation: "Son", aadhaarLast4: "3579" },
      { name: "Ananya Ramesh", age: 12, relation: "Daughter", aadhaarLast4: "4680" },
      { name: "Vikram Ramesh", age: 8, relation: "Son", aadhaarLast4: "5791" }
    ],
    address: "147 Birch Blvd, Bangalore North, Bangalore - 560005"
  },
  {
    rationCardNumber: "KA-BNG-2024-008",
    holderName: "Savitha",
    cardType: "APL",
    familyMembers: [
      { name: "Savitha", age: 32, relation: "Self", aadhaarLast4: "6801" },
      { name: "Manoj", age: 35, relation: "Husband", aadhaarLast4: "7912" },
      { name: "Priya Manoj", age: 10, relation: "Daughter", aadhaarLast4: "8023" },
      { name: "Rohan Manoj", age: 6, relation: "Son", aadhaarLast4: "9134" }
    ],
    address: "258 Spruce Way, Bangalore South, Bangalore - 560006"
  },
  {
    rationCardNumber: "KA-MYS-2024-009",
    holderName: "Krishna",
    cardType: "BPL",
    familyMembers: [
      { name: "Krishna", age: 58, relation: "Self", aadhaarLast4: "1245" },
      { name: "Radha Krishna", age: 52, relation: "Wife", aadhaarLast4: "2356" },
      { name: "Arjun Krishna", age: 26, relation: "Son", aadhaarLast4: "3467" },
      { name: "Meena Arjun", age: 24, relation: "Daughter-in-law", aadhaarLast4: "4578" },
      { name: "Aryan Arjun", age: 3, relation: "Grandson", aadhaarLast4: "5689" }
    ],
    address: "369 Redwood Sq, Mysore - 570003"
  },
  {
    rationCardNumber: "KA-BNG-2024-010",
    holderName: "Anand",
    cardType: "AAY",
    familyMembers: [
      { name: "Anand", age: 45, relation: "Self", aadhaarLast4: "6790" },
      { name: "Lakshmi Anand", age: 40, relation: "Wife", aadhaarLast4: "7891" },
      { name: "Sneha Anand", age: 18, relation: "Daughter", aadhaarLast4: "8901" },
      { name: "Karan Anand", age: 14, relation: "Son", aadhaarLast4: "9012" }
    ],
    address: "741 Sycamore Ct, Bangalore East, Bangalore - 560007"
  },
  {
    rationCardNumber: "KA-BNG-2024-011",
    holderName: "Meera",
    cardType: "PHH",
    familyMembers: [
      { name: "Meera", age: 29, relation: "Self", aadhaarLast4: "0123" },
      { name: "Raj Meera", age: 33, relation: "Husband", aadhaarLast4: "1234" },
      { name: "Ishaan Raj", age: 8, relation: "Son", aadhaarLast4: "2345" },
      { name: "Diya Raj", age: 5, relation: "Daughter", aadhaarLast4: "3456" }
    ],
    address: "852 Aspen Ter, Bangalore West, Bangalore - 560008"
  },
  {
    rationCardNumber: "KA-MYS-2024-012",
    holderName: "Vikram",
    cardType: "BPL",
    familyMembers: [
      { name: "Vikram", age: 50, relation: "Self", aadhaarLast4: "4567" },
      { name: "Pooja Vikram", age: 45, relation: "Wife", aadhaarLast4: "5678" },
      { name: "Aditya Vikram", age: 20, relation: "Son", aadhaarLast4: "6789" },
      { name: "Kavya Vikram", age: 17, relation: "Daughter", aadhaarLast4: "7890" }
    ],
    address: "963 Willow Ave, Mysore - 570004"
  },
  {
    rationCardNumber: "KA-BNG-2024-013",
    holderName: "Neha",
    cardType: "AAY",
    familyMembers: [
      { name: "Neha", age: 36, relation: "Self", aadhaarLast4: "8901" },
      { name: "Amit Neha", age: 38, relation: "Husband", aadhaarLast4: "9012" },
      { name: "Riya Amit", age: 12, relation: "Daughter", aadhaarLast4: "0123" },
      { name: "Rohan Amit", age: 9, relation: "Son", aadhaarLast4: "1234" },
      { name: "Zara Amit", age: 4, relation: "Daughter", aadhaarLast4: "2345" }
    ],
    address: "159 Poplar Dr, Bangalore North, Bangalore - 560009"
  },
  {
    rationCardNumber: "KA-BNG-2024-014",
    holderName: "Suresh",
    cardType: "APL",
    familyMembers: [
      { name: "Suresh", age: 41, relation: "Self", aadhaarLast4: "3456" },
      { name: "Anita Suresh", age: 37, relation: "Wife", aadhaarLast4: "4567" },
      { name: "Varun Suresh", age: 15, relation: "Son", aadhaarLast4: "5678" },
      { name: "Priya Suresh", age: 11, relation: "Daughter", aadhaarLast4: "6789" }
    ],
    address: "753 Hickory Ln, Bangalore South, Bangalore - 560010"
  },
  {
    rationCardNumber: "KA-MYS-2024-015",
    holderName: "Radhika",
    cardType: "PHH",
    familyMembers: [
      { name: "Radhika", age: 44, relation: "Self", aadhaarLast4: "7890" },
      { name: "Sunil Radhika", age: 47, relation: "Husband", aadhaarLast4: "8901" },
      { name: "Aarti Sunil", age: 22, relation: "Daughter", aadhaarLast4: "9012" },
      { name: "Vijay Sunil", age: 19, relation: "Son", aadhaarLast4: "0123" }
    ],
    address: "951 Dogwood Cir, Mysore - 570005"
  },
  {
    rationCardNumber: "KA-BNG-2024-016",
    holderName: "Prakash",
    cardType: "BPL",
    familyMembers: [
      { name: "Prakash", age: 53, relation: "Self", aadhaarLast4: "1234" },
      { name: "Meena Prakash", age: 48, relation: "Wife", aadhaarLast4: "2345" },
      { name: "Rahul Prakash", age: 25, relation: "Son", aadhaarLast4: "3456" },
      { name: "Swati Rahul", age: 23, relation: "Daughter-in-law", aadhaarLast4: "4567" },
      { name: "Kabir Rahul", age: 2, relation: "Grandson", aadhaarLast4: "5678" }
    ],
    address: "357 Elm St, Bangalore East, Bangalore - 560011"
  },
  {
    rationCardNumber: "KA-BNG-2024-017",
    holderName: "Divya",
    cardType: "AAY",
    familyMembers: [
      { name: "Divya", age: 31, relation: "Self", aadhaarLast4: "6789" },
      { name: "Nikhil Divya", age: 34, relation: "Husband", aadhaarLast4: "7890" },
      { name: "Aarav Nikhil", age: 7, relation: "Son", aadhaarLast4: "8901" },
      { name: "Anaya Nikhil", age: 4, relation: "Daughter", aadhaarLast4: "9012" }
    ],
    address: "462 Oak Ave, Bangalore West, Bangalore - 560012"
  },
  {
    rationCardNumber: "KA-MYS-2024-018",
    holderName: "Mahesh",
    cardType: "PHH",
    familyMembers: [
      { name: "Mahesh", age: 49, relation: "Self", aadhaarLast4: "0123" },
      { name: "Sunita Mahesh", age: 44, relation: "Wife", aadhaarLast4: "1234" },
      { name: "Pooja Mahesh", age: 21, relation: "Daughter", aadhaarLast4: "2345" },
      { name: "Rohit Mahesh", age: 18, relation: "Son", aadhaarLast4: "3456" }
    ],
    address: "828 Pine Rd, Mysore - 570006"
  },
  {
    rationCardNumber: "KA-BNG-2024-019",
    holderName: "Kavita",
    cardType: "BPL",
    familyMembers: [
      { name: "Kavita", age: 38, relation: "Self", aadhaarLast4: "4567" },
      { name: "Rajesh Kavita", age: 41, relation: "Husband", aadhaarLast4: "5678" },
      { name: "Ishita Rajesh", age: 13, relation: "Daughter", aadhaarLast4: "6789" },
      { name: "Vivaan Rajesh", age: 9, relation: "Son", aadhaarLast4: "7890" }
    ],
    address: "193 Maple Dr, Bangalore North, Bangalore - 560013"
  },
  {
    rationCardNumber: "KA-BNG-2024-020",
    holderName: "Arun",
    cardType: "APL",
    familyMembers: [
      { name: "Arun", age: 46, relation: "Self", aadhaarLast4: "8901" },
      { name: "Shweta Arun", age: 42, relation: "Wife", aadhaarLast4: "9012" },
      { name: "Karan Arun", age: 16, relation: "Son", aadhaarLast4: "0123" },
      { name: "Kiara Arun", age: 12, relation: "Daughter", aadhaarLast4: "1234" }
    ],
    address: "284 Birch Blvd, Bangalore South, Bangalore - 560014"
  },
  {
    rationCardNumber: "KA-MYS-2024-021",
    holderName: "Deepa",
    cardType: "AAY",
    familyMembers: [
      { name: "Deepa", age: 33, relation: "Self", aadhaarLast4: "2345" },
      { name: "Vikram Deepa", age: 36, relation: "Husband", aadhaarLast4: "3456" },
      { name: "Reya Vikram", age: 8, relation: "Daughter", aadhaarLast4: "4567" },
      { name: "Ayaan Vikram", age: 5, relation: "Son", aadhaarLast4: "5678" }
    ],
    address: "375 Spruce Way, Mysore - 570007"
  },
  {
    rationCardNumber: "KA-BNG-2024-022",
    holderName: "Rohit",
    cardType: "PHH",
    familyMembers: [
      { name: "Rohit", age: 40, relation: "Self", aadhaarLast4: "6789" },
      { name: "Priya Rohit", age: 37, relation: "Wife", aadhaarLast4: "7890" },
      { name: "Advik Rohit", age: 10, relation: "Son", aadhaarLast4: "8901" },
      { name: "Anvi Rohit", age: 6, relation: "Daughter", aadhaarLast4: "9012" }
    ],
    address: "466 Redwood Sq, Bangalore East, Bangalore - 560015"
  },
  {
    rationCardNumber: "KA-BNG-2024-023",
    holderName: "Swati",
    cardType: "BPL",
    familyMembers: [
      { name: "Swati", age: 35, relation: "Self", aadhaarLast4: "0123" },
      { name: "Amit Swati", age: 38, relation: "Husband", aadhaarLast4: "1234" },
      { name: "Yash Amit", age: 11, relation: "Son", aadhaarLast4: "2345" },
      { name: "Myra Amit", age: 7, relation: "Daughter", aadhaarLast4: "3456" }
    ],
    address: "557 Sycamore Ct, Bangalore West, Bangalore - 560016"
  },
  {
    rationCardNumber: "KA-MYS-2024-024",
    holderName: "Kiran",
    cardType: "AAY",
    familyMembers: [
      { name: "Kiran", age: 52, relation: "Self", aadhaarLast4: "4567" },
      { name: "Anjali Kiran", age: 47, relation: "Wife", aadhaarLast4: "5678" },
      { name: "Rohan Kiran", age: 23, relation: "Son", aadhaarLast4: "6789" },
      { name: "Pooja Kiran", age: 19, relation: "Daughter", aadhaarLast4: "7890" }
    ],
    address: "648 Aspen Ter, Mysore - 570008"
  },
  {
    rationCardNumber: "KA-BNG-2024-025",
    holderName: "Tina",
    cardType: "PHH",
    familyMembers: [
      { name: "Tina", age: 30, relation: "Self", aadhaarLast4: "8901" },
      { name: "Rahul Tina", age: 32, relation: "Husband", aadhaarLast4: "9012" },
      { name: "Aarushi Rahul", age: 6, relation: "Daughter", aadhaarLast4: "0123" },
      { name: "Vihaan Rahul", age: 3, relation: "Son", aadhaarLast4: "1234" }
    ],
    address: "739 Willow Ave, Bangalore North, Bangalore - 560017"
  },
  {
    rationCardNumber: "KA-BNG-2024-026",
    holderName: "Manish",
    cardType: "BPL",
    familyMembers: [
      { name: "Manish", age: 43, relation: "Self", aadhaarLast4: "2345" },
      { name: "Rashmi Manish", age: 39, relation: "Wife", aadhaarLast4: "3456" },
      { name: "Kabir Manish", age: 14, relation: "Son", aadhaarLast4: "4567" },
      { name: "Zara Manish", age: 10, relation: "Daughter", aadhaarLast4: "5678" }
    ],
    address: "820 Poplar Dr, Bangalore South, Bangalore - 560018"
  },
  {
    rationCardNumber: "KA-MYS-2024-027",
    holderName: "Preeti",
    cardType: "APL",
    familyMembers: [
      { name: "Preeti", age: 37, relation: "Self", aadhaarLast4: "6789" },
      { name: "Sanjay Preeti", age: 40, relation: "Husband", aadhaarLast4: "7890" },
      { name: "Ishan Sanjay", age: 12, relation: "Son", aadhaarLast4: "8901" },
      { name: "Anaya Sanjay", age: 8, relation: "Daughter", aadhaarLast4: "9012" }
    ],
    address: "911 Hickory Ln, Mysore - 570009"
  },
  {
    rationCardNumber: "KA-BNG-2024-028",
    holderName: "Vijay",
    cardType: "AAY",
    familyMembers: [
      { name: "Vijay", age: 48, relation: "Self", aadhaarLast4: "0123" },
      { name: "Neha Vijay", age: 43, relation: "Wife", aadhaarLast4: "1234" },
      { name: "Arjun Vijay", age: 17, relation: "Son", aadhaarLast4: "2345" },
      { name: "Aisha Vijay", age: 13, relation: "Daughter", aadhaarLast4: "3456" }
    ],
    address: "102 Dogwood Cir, Bangalore East, Bangalore - 560019"
  },
  {
    rationCardNumber: "KA-BNG-2024-029",
    holderName: "Sonam",
    cardType: "PHH",
    familyMembers: [
      { name: "Sonam", age: 34, relation: "Self", aadhaarLast4: "4567" },
      { name: "Rohit Sonam", age: 36, relation: "Husband", aadhaarLast4: "5678" },
      { name: "Reyansh Rohit", age: 9, relation: "Son", aadhaarLast4: "6789" },
      { name: "Ananya Rohit", age: 5, relation: "Daughter", aadhaarLast4: "7890" }
    ],
    address: "113 Elm St, Bangalore West, Bangalore - 560020"
  },
  {
    rationCardNumber: "KA-MYS-2024-030",
    holderName: "Ajay",
    cardType: "BPL",
    familyMembers: [
      { name: "Ajay", age: 51, relation: "Self", aadhaarLast4: "8901" },
      { name: "Kavita Ajay", age: 46, relation: "Wife", aadhaarLast4: "9012" },
      { name: "Vikram Ajay", age: 21, relation: "Son", aadhaarLast4: "0123" },
      { name: "Pooja Ajay", age: 18, relation: "Daughter", aadhaarLast4: "1234" },
      { name: "Rohan Ajay", age: 14, relation: "Son", aadhaarLast4: "2345" }
    ],
    address: "224 Oak Ave, Mysore - 570010"
  }
];

export async function seedRationCards() {
  try {
    logger.info("Starting ration card seeding...");
    
    for (const cardData of sampleRationCards) {
      await RationCard.findOneAndUpdate(
        { rationCardNumber: cardData.rationCardNumber },
        cardData,
        { upsert: true, new: true }
      );
    }
    
    logger.info(`Successfully seeded ${sampleRationCards.length} ration cards`);
  } catch (error) {
    logger.error("Error seeding ration cards:", error);
  }
}
