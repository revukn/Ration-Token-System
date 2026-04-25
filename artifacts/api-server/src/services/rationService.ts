export const getRationEntitlement = (cardType: string, familyMembers: number) => {
  // Per person rates
  const perPersonRates = {
    AAY: { rice: 20, ragiWheat: 5 },
    BPL: { rice: 10, ragiWheat: 2 },
    PHH: { rice: 5, ragiWheat: 0 },
    APL: { rice: 3, ragiWheat: 0 }
  };
  
  // Fixed per family (not per person)
  const perFamilyRates = {
    AAY: { sugar: 1, kerosene: 0 },
    BPL: { sugar: 0, kerosene: 0 },
    PHH: { sugar: 0, kerosene: 0 },
    APL: { sugar: 0, kerosene: 0 }
  };
  
  const personRate = perPersonRates[cardType as keyof typeof perPersonRates];
  const familyRate = perFamilyRates[cardType as keyof typeof perFamilyRates];
  
  if (!personRate || !familyRate) {
    throw new Error(`Invalid card type: ${cardType}`);
  }
  
  return {
    rice: personRate.rice * familyMembers,        // Per person × members
    ragiWheat: personRate.ragiWheat * familyMembers, // Per person × members
    sugar: familyRate.sugar,                       // Fixed per family
    kerosene: familyRate.kerosene                  // Fixed per family
  };
};

export const generateRationMessage = (rationCardNumber: string, cardType: string, familyMembers: number, shopName: string) => {
  const entitlement = getRationEntitlement(cardType, familyMembers);
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  return `🏛️ PUBLIC DISTRIBUTION SYSTEM - RATION ENTITLEMENT

DEAR BENEFICIARIES,
FOR YOUR RATION CARD NO. ${rationCardNumber} OF TYPE ${cardType};
FAMILY MEMBERS: ${familyMembers}

MONTHLY ENTITLEMENT FOR ${currentMonth}:
🍚 RICE: ${entitlement.rice} KG
🌾 RAGI/JOWAR: ${entitlement.ragiWheat} KG  
🍰 SUGAR: ${entitlement.sugar} KG
⛽ KEROSNE: ${entitlement.kerosene} LITERS

DISTRIBUTION: FREE OF COST (NFS Act, 2013)
FAIR PRICE SHOP: ${shopName}
TOLL FREE COMPLAINTS: 1967, 1800-425-6900

ಆತ್ಮೀಯ ಫಲಾನುಭವಿಗಳೇ,
ನಿಮ್ಮ ${cardType} ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ. ${rationCardNumber}
ಕುಟುಂಬ ಸದಸ್ಯರು: ${familyMembers}

${currentMonth} ತಿಂಗಳ ಮಂಜೂರಾತಿ:
🍚 ಅಕ್ಕಿ: ${entitlement.rice} ಕೆಜಿ
🌾 ರಾಗಿ/ಜೋಳ: ${entitlement.ragiWheat} ಕೆಜಿ
🍰 ಸಕ್ಕರೆ: ${entitlement.sugar} ಕೆಜಿ
⛽ ಕೇರೋಸಿನ್: ${entitlement.kerosene} ಲೀಟರ್

ಉಚಿತ ವಿತರಣೆ (ರಾಷ್ಟ್ರೀಯ ಆಹಾರ ಭದ್ರತಾ ಕಾಯ್ದೆ, 2013)
ನ್ಯಾಯಾಲಯ ದುಕಾಣ: ${shopName}
ದೂರುಗಳಿಗೆ: 1967, 1800-425-6900

📅 Valid: ${currentMonth} ${currentYear}
🏪 FCSKAR - Food & Civil Supplies Karnataka`;
};
