import FastNoiseLite from "https://esm.sh/fastnoise-lite";

let refs = null;

export function generateTerrainBodyFromStar(star)
{
    const noise = new FastNoiseLite();
    noise.SetSeed(1337);
    noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin); 
    noise.SetFrequency(0.1);
    return new TerrainBody("Default", "Earthen", star.size, 1337, noise);
}

export function setupDataTypes(_refs)
{
    refs=_refs;
    BlockData.setTypeDict();
    BiomeData.setTypeDict();
    PlanetData.setTypeDict();
    TerrainBody.setTypeDict();

    //Setup default objects
    refs.dtm.blockData.push(
    new BlockData("Air", "#FFF", 0),
    new BlockData("Dirt", "#775331", 1),
    new BlockData("GrassyDirt", "#2B9C36", 2),
    new BlockData("Stone", "#7C7C7C", 3),
    new BlockData("Sand", "#E7D7B4", 4),
    new BlockData("Water", "#2191E2", 5),
        new BlockData("Log", "#4D4026", 6),
        new BlockData("Leaves", "#3D782B", 7),
        new BlockData("Planks", "#67593D", 8),
        new BlockData("Chair", "#560000", 9),
        new BlockData("Stick", "#4D4026", 10),
        new BlockData("MagicMoveBlock", "#9D63FF", 11),
        new BlockData("Aluminium", "#CBCBCB", 12),
        new BlockData("Glass", "#FFFFFF", 13),
        new BlockData("Grass", "#3B682F", 14),
        new BlockData("Thruster", "#414141", 15), 
        new BlockData("Switch", "#787878", 16),
        new BlockData("Battery", "#414141", 17),
        new BlockData("SuspensionWheel", "#4B4B4B", 18),
        new BlockData("SteeringWheel", "#B79952", 19),
        new BlockData("Pyrock", "#743737", 20),
        new BlockData("Moonstone", "#5D7280", 21),
    );

    refs.dtm.biomeDatas.push(new BiomeData(
        "EarthPlains", 
        2, // surfaceBlock
        5, // fluidBlock
        4, // shoreBlock

        [1,6],   // groundLayerA
        [3, 60],  // groundLayerB
        [3, 140], // groundLayerC
        [3, 200], // groundLayerD
        [3, 250], // groundLayerE
        1, // layeringType
        [-1, 1], // erosionThresh
        [-1, 1], // weirdnessThresh
        [-1, 1], // moistureThresh
        [-1, 1], // heatThresh
        [-1, 1], // polenessThresh

        false, // isUnderwater

        0, // bonusHeight

        [0,0,0,0], // foliageA
        [0,0,0,0], // foliageB
        [0,0,0,0]  // foliageC
    ));

    refs.dtm.biomeDatas.push(new BiomeData(
        "RockyDesert",

        3, // surfaceBlock
        5, // fluidBlock
        3, // shoreBlock

        [3, 6],   // groundLayerA
        [3, 60],  // groundLayerB
        [3, 140], // groundLayerC
        [3, 200], // groundLayerD
        [3, 250], // groundLayerE

        1, // layeringType

        [10, 200], // erosionThresh
        [0, 0], // weirdnessThresh
        [0, 0], // moistureThresh
        [0, 0], // heatThresh 
        [0, 0], // polenessThresh

        false, // isUnderwater

        20, // bonusHeight

        [0,0,0,0], // foliageA
        [0,0,0,0], // foliageB
        [0,0,0,0]  // foliageC
    ));


    //name, biomes, blockPalletSwaps, miniStructPalletSwaps, hasOceans, hasAtmosphere
    let curPlanet = new PlanetData("Earthen", [0,1,0], ["EarthPlains","RockyDesert"], [[0,0],[1,1]], [1], true, true);



    const noise = new FastNoiseLite();
    noise.SetSeed(1337);
    noise.SetNoiseType(FastNoiseLite.NoiseType.Perlin); 
    noise.SetFrequency(0.1);


     refs.dtm.planets.push(curPlanet);
    let newP = refs.dtm.cloneObject(curPlanet); refs.dtm.planets.push(newP); newP.starColor = [Math.random(), Math.random(), Math.random()];
     newP = refs.dtm.cloneObject(curPlanet); refs.dtm.planets.push(newP); newP.starColor = [Math.random(), Math.random(), Math.random()];
     newP = refs.dtm.cloneObject(curPlanet); refs.dtm.planets.push(newP); newP.starColor = [Math.random(), Math.random(), Math.random()];
     newP = refs.dtm.cloneObject(curPlanet); refs.dtm.planets.push(newP); newP.starColor = [Math.random(), Math.random(), Math.random()];
     newP = refs.dtm.cloneObject(curPlanet); refs.dtm.planets.push(newP); newP.starColor = [Math.random(), Math.random(), Math.random()];

    refs.dtm.terrainBodies.push(new TerrainBody("Default", "Earthen", 200, 1337, noise));
}

export function sampleBlock( 
    worldBlockPos,     // { x, y, z }
    upDir,             // string or enum
    bodyGenData,
    dirRotIndexes,     // array
    biomeParams = null,
    calcBiomeParams = false
) {
	
  
    // Reorient coordinates (assumes you implemented this)
    // let reorPlanetBPos = worldBlockPos;//upDir.reorientCoordinatesI3(worldBlockPos);
		let reorPBP = refs.customMaths.reorientCoordinates(upDir, worldBlockPos);
		const reorPlanetBPos = {
        x: Math.abs(reorPBP[0]),
        y: Math.abs(reorPBP[1]),
        z: Math.abs(reorPBP[2]),
    };
    const absRPB = {
        x: Math.abs(reorPlanetBPos.x), 
        y: Math.abs(reorPlanetBPos.y),
        z: Math.abs(reorPlanetBPos.z)
    };

    const maxAltAxis = Math.max(absRPB.x, absRPB.z);
		if (maxAltAxis > bodyGenData.radius) {return 0;}
    if (calcBiomeParams || !biomeParams) {
        biomeParams = getBiomeParams(
            worldBlockPos,
            upDir,
            reorPlanetBPos.x,
            reorPlanetBPos.z, 
            bodyGenData
        );
    }
    let blockType = 0;
    let shapeIndex = 0; 

    const surfaceHInt = Math.floor(biomeParams.surfaceHeight);
    const decimDif = biomeParams.surfaceHeight - surfaceHInt;

    const biomeIndex = biomeParams.primaryBiomeIndxs[0];
    const biomeData = bodyGenData.planetData.biomeDatas[biomeIndex];

    // Above surface (foliage)
    if (
        reorPlanetBPos.y === surfaceHInt + 1 &&
        reorPlanetBPos.y !== maxAltAxis
    ) {
        if (decimDif >= 0.24) {
            // const belowPos = {
            //     x: worldBlockPos.x - upDir.getInt3().x,
            //     y: worldBlockPos.y - upDir.getInt3().y,
            //     z: worldBlockPos.z - upDir.getInt3().z
            // };

            // const sampleGroundBlock = new Block(
            //     sampleBlock(
            //         belowPos,
            //         upDir,
            //         bodyGenData,
            //         dirRotIndexes,
            //         biomeParams,
            //         false
            //     )
            // );

            // if (sampleGroundBlock.blockType === biomeData.surfaceBlock) {
//                 for (let f = 0; f < 3; f++) {
//                     const foliageData =
//                         f === 0
//                             ? biomeData.foliageA
//                             : f === 1
//                             ? biomeData.foliageB
//                             : biomeData.foliageC;

//                     if (foliageData[0] === 0) break;

//                     for (let r = 0; r < foliageData[3]; r++) {
//                         const h = refs.customMaths.hash(
//                             worldBlockPos.x,
//                             worldBlockPos.y,
//                             worldBlockPos.z
//                         );

//                         let rnd = refs.customMaths.rand01(h);
//                         rnd = rnd * rnd;

//                         if (rnd < 0.05) {
//                             blockType = foliageData[0];
//                         }
//                     }
//                 }
            // } 
        }
    }
    // Surface
    else if (
        reorPlanetBPos.y === surfaceHInt &&
        reorPlanetBPos.y !== maxAltAxis
    ) {
        blockType = biomeData.surfaceBlock;

        if (
            biomeParams.surfaceHeight <=
            bodyGenData.seaLevel + bodyGenData.shorelineThickness
        ) {
            blockType = biomeData.shoreBlock;
        }

        if (decimDif < 0.24) {
            shapeIndex = 2;
        }
    }
    // Below surface
    else if (reorPlanetBPos.y < surfaceHInt) {
			blockType=1;
        if (
            reorPlanetBPos.y >=
                surfaceHInt - bodyGenData.shorelineThickness &&
            biomeParams.surfaceHeight <=
                bodyGenData.seaLevel + bodyGenData.shorelineThickness
        ) {
            blockType = biomeData.shoreBlock;
        } else if (biomeData.layeringType === 1) {
            if (reorPlanetBPos.y >= surfaceHInt - biomeData.groundLayerA[1]) {
                blockType = biomeData.groundLayerA[0];
            } else if (
                reorPlanetBPos.y >= surfaceHInt - biomeData.groundLayerB[1]
            ) {
                blockType = biomeData.groundLayerB[0];
            } else if (
                reorPlanetBPos.y >= surfaceHInt - biomeData.groundLayerC[1]
            ) {
                blockType = biomeData.groundLayerC[0];
            } else if (
                reorPlanetBPos.y >= surfaceHInt - biomeData.groundLayerD[1]
            ) {
                blockType = biomeData.groundLayerD[0];
            } else if (
                reorPlanetBPos.y >= surfaceHInt - biomeData.groundLayerE[1]
            ) {
                blockType = biomeData.groundLayerE[0];
            }
        }
    }

    // Oceans
    if (
        bodyGenData.planetData.hasOceans &&
        (blockType === 0 || shapeIndex !== 0) &&
        reorPlanetBPos.y <= bodyGenData.seaLevel
    ) {
        blockType = biomeData.fluidBlock;
        shapeIndex = 0;

        if (reorPlanetBPos.y === bodyGenData.seaLevel) {
            if (maxAltAxis !== bodyGenData.seaLevel) shapeIndex = 3;
            else if (maxAltAxis === bodyGenData.seaLevel - 2) shapeIndex = 2;
            else if (maxAltAxis === bodyGenData.seaLevel - 1) shapeIndex = 1;
            else {
                shapeIndex = 0;
                blockType = 0;
            }
        }
    }

    // Palette swap
    if (bodyGenData.planetData.blockPalletSwaps && blockType !== 0) {
        const swaps = bodyGenData.planetData.blockPalletSwaps;
        for (let i = 0; i < swaps.length; i++) {
            if (swaps[i][0] === blockType) { 
                blockType = swaps[i][1];
                break;
            }
        }
    }
    return blockType;
}


function getSurfaceHeight(
    xCoord,
    yCoord,
    zCoord,
    horizontalPosX,
    horizontalPosZ,
    genData,
    includeSeaLvl = false,
    flatScale = 0.1,
    vertScale = 8.0
) {
    const baseLevel = genData.radius;

    xCoord *= flatScale;
    yCoord *= flatScale;
    zCoord *= flatScale;

    // Base noise layers
    let surfaceHeight =
        ((genData.noise.GetNoise(xCoord, yCoord, zCoord) + 0.5) * 2);

    surfaceHeight +=
        ((genData.noise.GetNoise(xCoord * 3, yCoord * 3, zCoord * 3) + 0.5) * 1);

    surfaceHeight += genData.landElevation;
    surfaceHeight *= 1.4 * vertScale;

    // Horizontal dampening
    const maxAltAxis = Math.max(Math.abs(horizontalPosX), Math.abs(horizontalPosZ));

    let dampenMultiplier = clamp(
        1 - (maxAltAxis / baseLevel),
        0.1,
        0.5
    ) - 0.1;

    dampenMultiplier *= (1 - dampenMultiplier);

    surfaceHeight = baseLevel + (surfaceHeight * dampenMultiplier);

    // Ocean vs non-ocean shaping
    if (genData.planetData.hasOceans) {
        const deEmbossVal = clamp(
            (maxAltAxis - (baseLevel - 80)) / 80,
            0,
            1
        );

        surfaceHeight -= (deEmbossVal * 24) + 0.5;

        surfaceHeight +=((genData.noise.GetNoise(xCoord * 5,
            yCoord * 5,
            zCoord * 5)+1)*0.5);
    } else {
        const deEmbossVal = clamp(
            (maxAltAxis - (baseLevel - 8)) / 8,
            0,
            1
        );

        surfaceHeight -= (deEmbossVal * 4) + 1;
    }

    // Sea level adjustment
    if (surfaceHeight >= genData.seaLevel && genData.seaLevel < baseLevel - 10) {
        surfaceHeight += 0.9;
    }

    if (includeSeaLvl && surfaceHeight <= genData.seaLevel) {
        surfaceHeight = genData.seaLevel;
    }

    return surfaceHeight;
}
export function getBiomeParams(
    worldPos,              // { x, y, z }
    chunkUpDir,            // string or enum equivalent
    horizontalPosX,
    horizontalPosZ,
    bodyGenData,
    includeSeaLvl = false
) {
    const baseLevel = bodyGenData.radius;
    // Adjust world position based on chunk direction
    if (chunkUpDir === 0) worldPos[1] = baseLevel;  //up
    else if (chunkUpDir === 1) worldPos[1]= -baseLevel; //down
    else if (chunkUpDir === 3) worldPos[0] = baseLevel;//right
    else if (chunkUpDir === 2) worldPos[0] = -baseLevel; //left
    else if (chunkUpDir === 4) worldPos[2] = baseLevel; //forward
    else if (chunkUpDir === 5) worldPos[2] = -baseLevel; //backward

    const xCoord = worldPos[0] + baseLevel + 1012312;
    const yCoord = worldPos[1] + baseLevel + 546234;
    const zCoord = worldPos[2] + baseLevel + 12348;

    const erosionZoom = 0.2;
    const erosion = Math.floor(
        bodyGenData.noise.GetNoise(xCoord * erosionZoom,
              yCoord * erosionZoom,
              zCoord * erosionZoom)*100);
    let weirdness = 0;
    let moisture = 0;
    let heat = 0;
    let poleness = 0;
    let surfaceHeight = getSurfaceHeight(
        xCoord,
        yCoord,
        zCoord,
        horizontalPosX,
        horizontalPosZ,
        bodyGenData,
        false
    );

    const isUnderwater = surfaceHeight <= bodyGenData.seaLevel;

    // int4 / float4 equivalents
    let biomeIndxs = [0, -1, -1, -1];
    let biomeWeights = [0.1, 0, 0, 0];

    let totalWeight = 0.1;
    let totalBiomeCount = 1;

    const biomes = bodyGenData.planetData.biomeDatas;

    for (let b = 1; b < biomes.length; b++) {
        const biomeScore = biomes[b].checkAgainstBiomeParams(
            erosion,
            weirdness,
            moisture,
            heat,
            poleness
        );

        if (biomeScore > biomeWeights[0]) {
            if (biomeIndxs[3] !== -1) {
                totalWeight -= biomeWeights[3];
            }

            biomeWeights[3] = biomeWeights[2];
            biomeIndxs[3] = biomeIndxs[2];

            biomeWeights[2] = biomeWeights[1];
            biomeIndxs[2] = biomeIndxs[1];

            biomeWeights[1] = biomeWeights[0];
            biomeIndxs[1] = biomeIndxs[0];

            biomeWeights[0] = biomeScore;
            biomeIndxs[0] = b;

            totalWeight += biomeScore;
            totalBiomeCount++;
        } else if (biomeScore > biomeWeights[1]) {
            biomeWeights[3] = biomeWeights[2];
            biomeIndxs[3] = biomeIndxs[2];

            biomeWeights[2] = biomeWeights[1];
            biomeIndxs[2] = biomeIndxs[1];

            biomeWeights[1] = biomeScore;
            biomeIndxs[1] = b;

            totalWeight += biomeScore;
            totalBiomeCount++;
        } else if (biomeScore > biomeWeights[2]) {
            biomeWeights[3] = biomeWeights[2];
            biomeIndxs[3] = biomeIndxs[2];

            biomeWeights[2] = biomeScore;
            biomeIndxs[2] = b;

            totalWeight += biomeScore;
            totalBiomeCount++;
        } else if (biomeScore > biomeWeights[3]) {
            biomeWeights[3] = biomeScore;
            biomeIndxs[3] = b;

            totalWeight += biomeScore;
            totalBiomeCount++;
        }
    }

    // Apply biome height modifiers
    for (let i = 0; i < 4; i++) {
        if (biomeIndxs[i] !== -1) {
            surfaceHeight +=
                biomes[biomeIndxs[i]].bonusHeight * biomeWeights[i];
        } else {
            break;
        }
    }

    if (includeSeaLvl && surfaceHeight <= bodyGenData.seaLevel) {
        surfaceHeight = bodyGenData.seaLevel;
    }

    return new BiomeParams(
        surfaceHeight,
        erosion,
        weirdness, 
        moisture,
        heat,
        poleness,
        isUnderwater,
        biomeIndxs,
        biomeWeights
    );
}

// Helper clamp function (Unity-style)
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}















 




class BlockData {
    static setTypeDict() {}
  constructor(name, color, id)
  {
    this.name=name; this.color=color; this.id=id;
  }
}
class PlanetData
{
	static setTypeDict(){
		refs.dtm.attributeTypeDict.set("blockPalletSwaps", refs.dtm.InputTagCombos.FlexArray.concat("Vector","2| from, to|Select.Block"));
		refs.dtm.attributeTypeDict.set("miniStructPalletSwaps", refs.dtm.InputTagCombos.FlexArray.concat("Vector","2| from, to|Int"));
		refs.dtm.attributeTypeDict.set("biomes", refs.dtm.InputTagCombos.TagList.concat("Select","Biome"));
	}
    constructor(name,starColor, biomes, blockPalletSwaps, miniStructPalletSwaps, hasOceans, hasAtmosphere)
   {
		 this.ignrPs=["biomeDatas", "oldName"];
     this.name=name; this.oldName=name;
         this.starColor=starColor;
		 this.hasOceans=hasOceans; this.hasAtmosphere= hasAtmosphere;
		 this.biomes=biomes;
      this.getBiomeDatas(); this.blockPalletSwaps=blockPalletSwaps; this.miniStructPalletSwaps = miniStructPalletSwaps; 
    }
	getBiomeDatas()
	{
		this.biomeDatas=[];
		this.biomes.forEach(biomeName=>{  
			const bd = refs.dtm.biomeDatas.find(bd=>bd.name==biomeName);
			if (bd) {this.biomeDatas.push(bd); }
		});
	}
	onChangeAttribute() 
	{
		this.getBiomeDatas();
		if (this.name != this.oldName)
		{
			terrainBodies.forEach(tb=>{
				if (tb.planetType == this.oldName)
				{
					tb.planetType=this.name;
					tb.onChangeAttribute();
				}
			});
			refreshConfigObject("terrainBodyCnfg");
			this.oldName=this.name;
		}
	}
	onSelect(){}
}
class ChunkBodyGenData {
    constructor(
        isPlanet,
        planetType,
        noise,
        radius,
        seaLevel,
        shorelineThickness,
        landElevation,
        skyLimit,
      planetData
    ) {
        this.isPlanet = isPlanet;
        this.planetType = planetType;
        this.noise = noise; // expected to be an object with getNoise(...)
        this.radius = radius;
        this.seaLevel = seaLevel;
        this.shorelineThickness = shorelineThickness;
        this.landElevation = landElevation;
        this.skyLimit = skyLimit;
      this.planetData=planetData;
    }
}
class TerrainBody{
	static setTypeDict(){
		refs.dtm.attributeTypeDict.set("planetType", refs.dtm.InputTagCombos.Select.concat("Planet"));
	}
	constructor(name, planetType, radius, seed, pnoise)
	{
		this.ignrPs=["genData","planetData", "oldName"];
		this.name=name; this.planetType = planetType; this.radius=radius;
		this.oldName=name;
		this.planetData=refs.dtm.planets.find(planet=>planet.name==this.planetType);
		this.seed= seed;
		pnoise.SetSeed(seed);
		this.genData = new ChunkBodyGenData(true, // isPlanet, 
        refs.dtm.planets.indexOf(this.planetData), //   planetType,
        pnoise, //   noise,
        radius, //   radius,
        radius, //   seaLevel,
        1.8, //   shorelineThickness,
        0, //   landElevation,
        300, //   skyLimit, 
      this.planetData); // planetData
	}
	onChangeAttribute()
	{
		this.planetData=planets.find(planet=>planet.name==this.planetType);
		this.genData.planetData = this.planetData;
		this.genData.radius = this.radius;
		this.genData.seaLevel = this.radius;
		this.genData.skyLimit = this.radius+100;
		this.genData.noise.SetSeed(this.seed);
		if (selectedTerrainBody === this) {setCurTerrainBody(this);}
	}
	onSelect()
	{
		setCurTerrainBody(this);
		window.onTriggerPreviewUpdate();
	}
}


class BiomeData {
		static setTypeDict(){
			refs.dtm.attributeTypeDict.set("surfaceBlock", refs.dtm.InputTagCombos.Select.concat("Block"));
			refs.dtm.attributeTypeDict.set("fluidBlock", refs.dtm.InputTagCombos.Select.concat("Block")); 
			refs.dtm.attributeTypeDict.set("shoreBlock", refs.dtm.InputTagCombos.Select.concat("Block"));
			refs.dtm.attributeTypeDict.set("groundLayers", refs.dtm.InputTagCombos.Array.concat("5","Vector","2| , Y|Select.Block,Int"));
		} 
    constructor(
        name,
        surfaceBlock, 
        fluidBlock, 
        shoreBlock,
        groundLayerA,
        groundLayerB,
        groundLayerC, 
        groundLayerD,
        groundLayerE,
        layeringType,
        erosionThresh,
        weirdnessThresh,
        moistureThresh,
        heatThresh,
        polenessThresh,
        isUnderwater,
        bonusHeight = 0,
        foliageA = [0, 0, 0, 0],
        foliageB = [0, 0, 0, 0],
        foliageC = [0, 0, 0, 0]
    ) {
			this.ignrPs=["oldName","groundLayerA","groundLayerB","groundLayerC","groundLayerD","groundLayerE"];
      this.name=name;
			this.oldName=name;
        this.surfaceBlock = surfaceBlock;
        this.fluidBlock = fluidBlock;
        this.shoreBlock = shoreBlock;
        this.groundLayerA = groundLayerA; // [x, y]
        this.groundLayerB = groundLayerB;
        this.groundLayerC = groundLayerC;
        this.groundLayerD = groundLayerD;
        this.groundLayerE = groundLayerE;
				this.assignToUIGroundLayers();
        this.layeringType = layeringType;
        this.erosionThresh = erosionThresh;     // [x, y]
        this.weirdnessThresh = weirdnessThresh; // [x, y]
        this.moistureThresh = moistureThresh;   // [x, y]
        this.heatThresh = heatThresh;           // [x, y]
        this.polenessThresh = polenessThresh;   // [x, y] 
        this.isUnderwater = isUnderwater;
        this.bonusHeight = bonusHeight;
        this.foliageA = foliageA; // [x, y, z, w]
        this.foliageB = foliageB;
        this.foliageC = foliageC;
    }
  assignToUIGroundLayers()
	{
		this.groundLayers= new Array(5);
		for (let i = 0; i < 5; i++)
		{
			let letter=String.fromCharCode(65+i);
			this.groundLayers[i] = this["groundLayer"+letter];
		}
	}
	assignFromUIGroundLayers()
	{
		for (let i = 0; i < 5; i++)
		{
			let letter=String.fromCharCode(65+i);
			this["groundLayer"+letter] = this.groundLayers[i];
		}
	}
  checkAgainstBiomeParams(erosion, weirdness, moisture, heat, poleness) 
    {
        let score = 0;
        score += compareThresholdClosesness(erosion, this.erosionThresh);
        score += compareThresholdClosesness(weirdness, this.weirdnessThresh);
        score += compareThresholdClosesness(moisture, this.moistureThresh);
        score += compareThresholdClosesness(heat, this.heatThresh);
        //score += compareThresholdClosesness(biomeParams.poleness, this.polenessThresh);
        return score;
    }
	onChangeAttribute()
	{
		if (this.name != this.oldName)
				{
			planets.forEach(planet=>{
				const bIndx = planet.biomes.indexOf(this.oldName);
				if (bIndx >=0) {planet.biomes[bIndx] = this.name; planet.onChangeAttribute();}console.log("updated old planet biome ref"); refreshConfigObject("planetCnfg-"+planet.name)}
			);
				this.oldName=this.name;
			}
		this.assignFromUIGroundLayers();
	}
	onSelect(){}
}
class BiomeParams {
    constructor( 
        surfaceHeight,
        erosion,
        weirdness,
        moisture,
        heat,
        poleness,
        isUnderwater,
        primaryBiomeIndxs = [0, 0, 0, 0],
        primaryBiomeWeights = [0, 0, 0, 0]
    ) {
        this.surfaceHeight = surfaceHeight;
        this.erosion = erosion;
        this.weirdness = weirdness;
        this.moisture = moisture;
        this.heat = heat;
        this.poleness = poleness;
        this.isUnderwater = isUnderwater;

        // int4 / float4 equivalents
        this.primaryBiomeIndxs = primaryBiomeIndxs;
        this.primaryBiomeWeights = primaryBiomeWeights;
    }
}
function compareThresholdClosesness(val,thresh)
{
  if (val <= thresh[0]) { return 0; }
  else if (val >= thresh[1]) { return 0; }
  else if (thresh[0] == thresh[1]) { return 0; }
  else
  {
    val -= thresh[0];
    const center = ((thresh[0] + thresh[1]) / 2) - thresh[0];
    return 1 - Math.abs(val - center) / center;
  }
}








