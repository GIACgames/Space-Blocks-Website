export const planets = []; export const biomeDatas = []; export const terrainBodies = []; export const blockData=[];
export const InputTypeTags = {Numeric:'',Int:'',Float:'',Vector:'',TagList:'',Array:'',Flex:'',Select:''};

for (let prop in InputTypeTags){InputTypeTags[prop] = prop;}
export const InputTagCombos = {
  Int: ['Numeric', 'Int'],
  Float: ['Numeric', 'Float'],
  Vector: ['Vector'],
	TagList: ['TagList'],
	FlexArray: ['Array', 'Flex'],
	Array: ['Array'],
	Select: ['Select']
};
export const attributeTypeDict = new Map();
export const ListTypeMap = new Map();
ListTypeMap.set("Planet", planets);ListTypeMap.set("planetCnfg", planets);
ListTypeMap.set("Biome", biomeDatas);ListTypeMap.set("biomeCnfg", biomeDatas);
ListTypeMap.set("TerrainBody", terrainBodies);ListTypeMap.set("terrainBodyCnfg", terrainBodies);
ListTypeMap.set("Block", blockData);ListTypeMap.set("blockCnfg", blockData);


export function cloneObject(obj) {
  // primitives
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // arrays
  if (Array.isArray(obj)) {
    return obj.map(item => cloneObject(item));
  }

  // preserve prototype (works for class instances)
  const clone = Object.create(Object.getPrototypeOf(obj));

  for (const key of Object.keys(obj)) {
    clone[key] = cloneObject(obj[key]);
  }

  return clone;
}
export function hexToRgbArray(hex) {
  // Remove leading #
  hex = hex.replace(/^#/, '');

  // Expand shorthand form (#FFF → #FFFFFF)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}