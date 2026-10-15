export interface CosumarTruck {
  plate: string;
  driver: string;
}

export const COSUMAR_FLEET: CosumarTruck[] = [
  // Lot 1 (Image 1)
  { plate: '70605A55', driver: 'BENNAR EEDOUANE' },
  { plate: '56063A55', driver: 'AZIZ EZZAHED' },
  { plate: '58904A55', driver: 'ABDELILAH MANSOURI' },
  { plate: '56064A55', driver: 'KITRA KANDIL' },

  // Lot 2 (Image 2)
  { plate: '12325D6', driver: 'CHAKIR SAID' },
  { plate: '12326D6', driver: 'HAJJAJI MOHAMMED' },
  { plate: '46182A7', driver: 'MOUTAWAKIL ADIL' },
  { plate: '11652A13', driver: 'ILYASS ELQADIRY' },
  { plate: '25395A72', driver: 'CHAOUCHE JAMAL' },
  { plate: '35664D6', driver: 'MOHAMMED EL HARIRI' },
  { plate: '1952A81', driver: 'KHALED WAHOUB' },

  // Lot 3 (Image 3)
  { plate: '65334A55', driver: 'MAHFOUD ABDERRAHIM' },
  { plate: '65335A55', driver: 'BENDAM RACHID' },
  { plate: '65336A55', driver: 'CHARKAUI MUSTAPHA' },
  { plate: '65337A55', driver: 'GRICHI MOHAMMED' },
  { plate: '66068A55', driver: 'AMAIZE AHMED' },
  { plate: '66069A55', driver: 'ESSAFI AHMED' },
  { plate: '66070A55', driver: 'ORCHI AMINE' },
  { plate: '66071A55', driver: 'ARIF ELMUSTAPHA' },
  { plate: '70608A55', driver: 'OALED ABOUBIA MOHAMMED' },
  { plate: '70607A55', driver: 'LAHMOUDI YASSINE' },

  // Lot 4 (Image 4)
  { plate: '3102A74', driver: 'MEHDI CHAHID' },
  { plate: '3106A74', driver: 'NADI MAATI' },
  { plate: '3676A74', driver: 'RAMI KHALIL' },
  { plate: '9072A74', driver: 'BENMESSY ABDERAHMAN' },
  { plate: '3108A74', driver: 'ABDELALI BELRHALIA' },
  { plate: '7968A74', driver: 'BOUSALIM ABDELATIF' },
  { plate: '3853A74', driver: 'AYOUB FLAIKI' },

  // Lot 5 (Image 5)
  { plate: '2804D6', driver: 'MOUHAJER ABDELMAJID' },
  { plate: '14366D6', driver: 'ES SKALLI EL HOUSSINE' },
  { plate: '6179A73', driver: 'BOUNHIRAT MUSTAPHA' },
  { plate: '6121D6', driver: 'BADRI ABDERRAHIM' },
  { plate: '60442A7', driver: 'KHALED EL HASSNAOUI' },
  { plate: '97223B6', driver: 'YOUSSEF ARBIBE' },
  { plate: '28577A72', driver: 'HASSAN SABAR' },
  { plate: '42960A7', driver: 'SEMLALI ABDERRAHIM' },
  { plate: '48252A7', driver: 'EL GORCH MOHAMMED' },
  { plate: '26991D6', driver: 'HABIB OUSSOUS' },
];

export function findDriverByPlate(plate: string): string | undefined {
  const clean = plate.toUpperCase().replace(/\s|-/g, '');
  const match = COSUMAR_FLEET.find(
    f => f.plate.toUpperCase().replace(/\s|-/g, '') === clean
  );
  return match?.driver;
}
