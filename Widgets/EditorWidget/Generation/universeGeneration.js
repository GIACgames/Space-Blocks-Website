let customMaths = null;
let centerSSect = null;
let refs = null;
function start(_refs)
{
    refs = _refs;
}
function createUniverse(seed) {
    customMaths = refs.customMaths;
    let halfGSect = CosmicHelper.sSectsInGsect*0.5;
    centerSSect = customMaths.vecFloor({x:halfGSect,y:halfGSect,z:halfGSect});
    return new Universe(seed);
}






class StarBuffer {
    constructor(capacity) {
        this.capacity = capacity;

        this.starPsX = new Int32Array(capacity);
        this.starPsY = new Int32Array(capacity);
        this.starPsZ = new Int32Array(capacity);
        this.starInfos = new Uint32Array(capacity);

        this.nextFree = 0;

        // free blocks: [{start, count}]
        this.freeList = [];
    }

    alloc(count) {
        // try reuse freed block
        for (let i = 0; i < this.freeList.length; i++) {
            const block = this.freeList[i];
            if (block.count >= count) {
                const start = block.start;

                // shrink or remove block
                if (block.count === count) {
                    this.freeList.splice(i, 1);
                } else {
                    block.start += count;
                    block.count -= count;
                }

                return start;
            }
        }

        // fallback: grow forward
        if (this.nextFree + count > this.capacity) {
            throw new Error("StarBuffer overflow");
        }

        const start = this.nextFree;
        this.nextFree += count;
        return start;
    }

    free(start, count) {
        this.freeList.push({ start, count });
        // (optional: merge blocks later for defrag)
    }

    setStar(i, x, y, z, type, size) {
        this.starPsX[i] = x;
        this.starPsY[i] = y;
        this.starPsZ[i] = z;
        if (size < 30) {console.log("size too small!");}
        this.starInfos[i] = StarBuffer.packStarInfo(type, Math.ceil(size/10));
        if (StarBuffer.unpackStarSize(this.starInfos[i]) * 10 < 30) {console.log("GOTCHEEEH!");}
    }

    static packStarInfo(type, size) {
        return (type & 0xff) | ((size & 0xff) << 8);
    }

    static unpackStarType(info) {
        return info & 0xff;
    }

    static unpackStarSize(info) {
        return (info >> 8) & 0xff;
    }
}



class GSect {
    constructor(gsectK, isSolarSystem, isBase, seed) {
        this.seed = seed;
        this.gSectK = gsectK;

        this.isSolarSystem = isSolarSystem;
        this.isBase = isBase;
        this.checkedForLoad = true;

        this.starStart = -1;
        this.starCount = 0;
    }
    static getGSectSeed(gSector, uSectSeed) {
        return customMaths.generateUniqueNumber(uSectSeed) + customMaths.getSeedFromVector3(gSector);
    }
}
class USect {
    constructor(usectK, isGalaxy, isBase, seed) {
        this.gSects = new Map();

        this.seed = seed;
        this.uSectK = usectK;
        this.isGalaxy = isGalaxy;
        this.isBase = isBase;
        this.checkedForLoad = true;
        this.solarSystems = [];
        this.solarSystemsSet = new Set();
    }
    setSolarSystems(ss)
    {
        this.solarSystems = ss;
        this.solarSystemsSet = new Set(ss);
    }
    static posToGSectIndex(gSectPos) {
        return (gSectPos.x) + 100 * (gSectPos.y) + 100 * 100 * (gSectPos.z);
    }
    static gSectIndexToPos(key) {
        const scale = 100;
        let x = key % scale;
        let y = (key / scale) % scale;
        let z = key / (scale * scale);
        return customMaths.vecFloor({ x, y, z });
    }
    static GetUSectSeed(uSector, universe) {
        return customMaths.generateUniqueNumber(universe.seed) + customMaths.getSeedFromVector3(uSector);
    }
    static checkGalaxyInUSect(uSector, seed) {
        return customMaths.randInt(0, 10, seed) <= 4;
    }
    static GetBaseGSector(uSector, solarSystemPoints, seed) //Warning does not account for whether it is in base galaxy
    {
        const baseGSectIndex = Math.round(solarSystemPoints.length / 8);
        return this.gSectIndexToPos(solarSystemPoints[baseGSectIndex]);
    }

}


class Universe {
    constructor(seed) {
        this.seed = seed;
        this.uSects = new Map();
        this.starData = new StarBuffer(100000);
        this.baseUSector = this.getBaseUSector(seed);
        const baseUsectObj = new USect(this.baseUSector, true, true, USect.GetUSectSeed(this.baseUSector, this));
        baseUsectObj.setSolarSystems(Galaxy.generateGalaxy(baseUsectObj, baseUsectObj.seed, true));
        this.baseGSector = USect.GetBaseGSector(baseUsectObj, baseUsectObj.solarSystems, baseUsectObj.seed);
        this.findStarsToMap(this.baseUSector, { x: 49, y: 53, z: 46 }, 1);
    }
    getBasePlanet()
    {
        let uSect=null;
        if (this.uSects.has(this.baseUSector)) {uSect = this.uSects[this.baseUSector];}
        else {uSect = new USect(this.baseUSector, true, true, USect.GetUSectSeed(this.baseUSector, this));}
        const star = SolarSystem.getStars(uSect,this.baseGSector,GSect.getGSectSeed(this.baseGSector, uSect.seed),true,true)[0];

        const upos= CosmicHelper.getUniversalPos(uSect.uSectK, this.baseGSector, star.pos);
        return {pos: upos, size: star.size, starType: star.planetType}
    }
    getPlanetFromPos(upos)
    {
        const uSectK = CosmicHelper.getUSectKeyFromUPos(upos);
        const gSectK = CosmicHelper.getGSectKeyFromUPos(upos);
        const sSectK = CosmicHelper.getSSectKeyFromUPos(upos);
        let uSect=null;
        if (this.uSects.has(this.baseUSector)) {uSect = this.uSects[this.baseUSector];}
        else {uSect = new USect(this.baseUSector, true, true, USect.GetUSectSeed(this.baseUSector, this));}
        const stars = SolarSystem.getStars(uSect,this.baseGSector,GSect.getGSectSeed(gSectK, uSect.seed),true,true);

        let star = stars.find(str=>customMaths.vecEqual(str.pos, sSectK, 1.5)); 
        if (!star) {return null;}
        else { return {pos: upos, size: star.size, starType: star.planetType}}
        
    }

    findStarsToMap(renderUSect, renderGSect, renderDistRange) {
        const uSects = this.uSects;
        const starBuffer = this.starData;

        const renderDistGSects = 150;//Math.floor(renderDistRange / CosmicHelper.sSectsInGsect);

        const curGSect = { x: 0, y: 0, z: 0 };

        // --- LOAD / MARK ---
        for (curGSect.x = renderGSect.x - renderDistGSects; curGSect.x < renderGSect.x + renderDistGSects; curGSect.x++) {
            for (curGSect.y = renderGSect.y - renderDistGSects; curGSect.y < renderGSect.y + renderDistGSects; curGSect.y++) {
                for (curGSect.z = renderGSect.z - renderDistGSects; curGSect.z < renderGSect.z + renderDistGSects; curGSect.z++) {
                    if (customMaths.distance3D(renderGSect, curGSect) >= renderDistGSects) continue;
                    let sSectK = {
                        x: CosmicHelper.sSectsInGsect / 2,
                        y: CosmicHelper.sSectsInGsect / 2,
                        z: CosmicHelper.sSectsInGsect / 2
                    };

                    let gSectK = { ...curGSect };
                    let uSectK = { ...renderUSect };

                    CosmicHelper.correctCosmicAddress(uSectK, gSectK, sSectK);

                    const gSectIndx = USect.posToGSectIndex(gSectK);

                    let uSect = uSects.get(customMaths.vecToString(uSectK));
                    let gSect = null;

                    // --- U SECT ---
                    if (!uSect) {
                        uSect = new USect(uSectK, false, false, 0);
                        uSect.gSects = new Map();

                        uSect.seed = USect.GetUSectSeed(uSectK, this);
                        
                        uSect.isBase = customMaths.vecEqual(this.baseUSector, uSectK);
                        uSect.isGalaxy = uSect.isBase || USect.checkGalaxyInUSect(uSectK, this.seed);
                        if (uSect.isGalaxy) {
                            
                            const sses = Galaxy.generateGalaxy(uSectK, uSect.seed, uSect.isBase);
                            uSect.setSolarSystems(sses);
                            if (uSect.isBase)
                            {
                                uSect.baseGSector = USect.GetBaseGSector(uSectK, sses, uSect.seed);
                            }
                        }

                        uSects.set(customMaths.vecToString(uSectK), uSect);
                    } else {
                        uSect.checkedForLoad = true;
                    }

                    // --- G SECT ---
                    gSect = uSect.gSects.get(gSectIndx);

                    if (!gSect) {
                        const hasSolarSystem = uSect.isGalaxy && uSect.solarSystemsSet.has(gSectIndx);
                        if (hasSolarSystem) {
                            gSect = new GSect(gSectK, true, false, 0);

                            gSect.seed = GSect.getGSectSeed(gSectK, uSect.seed);
                            gSect.isBase =uSect.isBase && customMaths.vecEqual(uSect.baseGSector, gSectK);

                            // --- GENERATE STARS ---
                            const stars = SolarSystem.getStars(uSectK, gSectIndx, gSect.seed, gSect.isBase, true);

                            const count = stars.length;
                            const start = starBuffer.alloc(count);

                            for (let i = 0; i < count; i++) {
                                const s = stars[i];
                                const idx = start + i;
                                const relPos = CosmicHelper.getUniversalPos(uSect.uSectK, gSect.gSectK, s.pos);
                                starBuffer.setStar(idx, relPos.x, relPos.y, relPos.z, s.planetType, s.size);
                            }

                            gSect.starStart = start;
                            gSect.starCount = count;

                            uSect.gSects.set(gSectIndx, gSect);
                        }
                    } else {
                        gSect.checkedForLoad = true;
                    }
                }
            }
        }

        // --- COLLECT + UNLOAD ---
        if (!this.stars) this.stars = [];
        this.stars.length = 0;

        const uSectsToRemove = [];

        for (const [uKey, uSect] of uSects) {

            if (!uSect.checkedForLoad) {
                uSectsToRemove.push(uKey);
                continue;
            }

            const gSectsToRemove = [];

            for (const [gKey, gSect] of uSect.gSects) {

                if (!gSect.checkedForLoad) {
                    // FREE STAR MEMORY
                    starBuffer.free(gSect.starStart, gSect.starCount);
                    gSectsToRemove.push(gKey);
                    continue;
                }

                if (gSect.isSolarSystem) {

                    for (let i = 0; i < gSect.starCount; i++) {
                        const idx = gSect.starStart + i;

                        const relPos = CosmicHelper.getUniversalPos(
                            uSect.uSectK,
                            gSect.gSectK,
                            {
                                x: starBuffer.starPsX[idx],
                                y: starBuffer.starPsY[idx],
                                z: starBuffer.starPsZ[idx]
                            }
                        );

                        this.stars.push({
                            x: relPos.x,
                            y: relPos.y,
                            z: relPos.z,
                            type: StarBuffer.unpackStarType(starBuffer.starInfos[idx]),
                            size: StarBuffer.unpackStarSize(starBuffer.starInfos[idx])
                        });
                    }
                }

                gSect.checkedForLoad = false;
            }

            for (const gKey of gSectsToRemove) {
                uSect.gSects.delete(gKey);
            }

            uSect.checkedForLoad = false;
        }

        for (const uKey of uSectsToRemove) {
            uSects.delete(uKey);
        }
    }


    getBaseUSector(seed) {
        return { x: 0, y: 0, z: 0 };
        let dir = { x: 0, y: 0, z: 0 };

        dir.x = customMaths.randInt(0, 100, seed) / 100;
        seed = customMaths.nextSeed(seed);

        dir.y = customMaths.randInt(0, 100, seed) / 100;
        seed = customMaths.nextSeed(seed);

        dir.z = customMaths.randInt(0, 100, seed) / 100;
        seed = customMaths.nextSeed(seed);

        // normalize
        const length = Math.hypot(dir.x, dir.y, dir.z) || 1;
        dir.x /= length;
        dir.y /= length;
        dir.z /= length;

        // multiply by 30 and round like Vector3Int.RoundToInt
        return {
            x: Math.round(dir.x * 30),
            y: Math.round(dir.y * 30),
            z: Math.round(dir.z * 30),
        };
    }
}





class CosmicAddress {
    constructor(uSectKey, gSectKey, sSectKey, posInSSect) {
        this.uSectKey = uSectKey;
        this.gSectKey = gSectKey;
        this.sSectKey = sSectKey;
        this.posInSSect = posInSSect;
    }

    toString() {
        return (
            vecToString(this.uSectKey) + "," +
            vecToString(this.gSectKey) + "," +
            vecToString(this.sSectKey) + "," +
            vecToString(this.posInSSect)
        );
    }

    static fromString(str) {
        const segs = str.split(",");
        return new CosmicAddress(
            stringToVecInt(segs[0]),
            stringToVecInt(segs[1]),
            stringToVecInt(segs[2]),
            stringToVec(segs[3])
        );
    }
}
const CosmicHelper = {
    gSectsInUsect: 100,
    sSectsInGsect: 100,
    blocksInSSect: 1000,

    checkGSectInUSect(g) {
        return g.x >= 0 && g.y >= 0 && g.z >= 0 &&
            g.x < this.gSectsInUsect &&
            g.y < this.gSectsInUsect &&
            g.z < this.gSectsInUsect;
    },

    checkSSectInGSect(s) {
        return s.x >= 0 && s.y >= 0 && s.z >= 0 &&
            s.x < this.sSectsInGsect &&
            s.y < this.sSectsInGsect &&
            s.z < this.sSectsInGsect;
    },

    checkBlockInSSect(b) {
        return b.x >= 0 && b.y >= 0 && b.z >= 0 &&
            b.x < this.blocksInSSect &&
            b.y < this.blocksInSSect &&
            b.z < this.blocksInSSect;
    },

    correctCosmicAddress(u, g, s) {
        // SSect overflow → GSect
        if (!this.checkSSectInGSect(s)) {
            const change = customMaths.vecFloorDiv(s, this.sSectsInGsect);
            s.x -= change.x * this.sSectsInGsect;
            s.y -= change.y * this.sSectsInGsect;
            s.z -= change.z * this.sSectsInGsect;

            g.x += change.x;
            g.y += change.y;
            g.z += change.z;
        }

        // GSect overflow → USect
        if (!this.checkGSectInUSect(g)) {
            const change = customMaths.vecFloorDiv(g, this.gSectsInUsect);

            g.x -= change.x * this.gSectsInUsect;
            g.y -= change.y * this.gSectsInUsect;
            g.z -= change.z * this.gSectsInUsect;

            u.x += change.x;
            u.y += change.y;
            u.z += change.z;
        }
    },

    correctCosmicAddressWithPos(u, g, s, pos) {
        const block = customMaths.vecFloor(pos);

        if (!this.checkBlockInSSect(block)) {
            const change = customMaths.vecFloorDiv(block, this.blocksInSSect);

            pos.x -= change.x * this.blocksInSSect;
            pos.y -= change.y * this.blocksInSSect;
            pos.z -= change.z * this.blocksInSSect;

            s.x += change.x;
            s.y += change.y;
            s.z += change.z;
        }

        this.correctCosmicAddress(u, g, s);
    },

    getUniversalPos(u, g, s) {
        const mul = this.sSectsInGsect * this.gSectsInUsect;

        return {
            x: u.x * mul + g.x * this.sSectsInGsect + s.x,
            y: u.y * mul + g.y * this.sSectsInGsect + s.y,
            z: u.z * mul + g.z * this.sSectsInGsect + s.z
        };
    },

    getUSectKeyFromUPos(p) {
        const div = this.sSectsInGsect * this.gSectsInUsect;

        return {
            x: Math.floor(p.x / div),
            y: Math.floor(p.y / div),
            z: Math.floor(p.z / div)
        };
    },

    getGSectKeyFromUPos(p) {
        const u = this.getUSectKeyFromUPos(p);
        const mul = this.sSectsInGsect * this.gSectsInUsect;

        const rem = {
            x: p.x - u.x * mul,
            y: p.y - u.y * mul,
            z: p.z - u.z * mul
        };

        return {
            x: Math.floor(rem.x / this.sSectsInGsect),
            y: Math.floor(rem.y / this.sSectsInGsect),
            z: Math.floor(rem.z / this.sSectsInGsect)
        };
    },

    getSSectKeyFromUPos(p) {
        const u = this.getUSectKeyFromUPos(p);
        const g = this.getGSectKeyFromUPos(p);

        const mul = this.sSectsInGsect * this.gSectsInUsect;

        return {
            x: p.x - u.x * mul - g.x * this.sSectsInGsect,
            y: p.y - u.y * mul - g.y * this.sSectsInGsect,
            z: p.z - u.z * mul - g.z * this.sSectsInGsect
        };
    },

    getCosmicDisplacement(a, b) {
        return {
            x: b.x - a.x,
            y: b.y - a.y,
            z: b.z - a.z
        };
    },

    getCosmicDistance(a, b) {
        const d = this.getCosmicDisplacement(a, b);
        return Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
    }
};







class SolarSystem {
    static getStars(uSector, gSectKey, seed = -1, isBaseSolarSystem = false, systemInSect = true) {
        if (systemInSect) {
            let systemType = 0;

            if (isBaseSolarSystem) {
                systemType = 0;
            }

            if (systemType === 0) {
                return this.getStarsType0(seed, isBaseSolarSystem);
            }
        }

        return null;
    }
    
    static getStarsType0(seed, isBaseSolarSystem = false) {
        let planetCount = customMaths.randInt(1, 3, seed);
        let basePlanet = -1;

        if (isBaseSolarSystem) {
            basePlanet = 0;
            planetCount = 5;
        }

        let pcsDecider = customMaths.randInt(0, 12, seed + seed + 7);

        if (pcsDecider > 9) {
            planetCount += 6;
        } else if (pcsDecider > 6) {
            planetCount += 3;
        }

        let curRange = 2;

        const stars = new Array(planetCount);

        // NOTE: centerSSect is assumed external like in your C#
        const centerPos = {
            x: centerSSect.x + 0.5,
            y: centerSSect.y + 0.5,
            z: centerSSect.z + 0.5,
        };

        let pSeed = customMaths.nextSeed(seed);
        for (let p = 0; p < planetCount; p++) {
            const orbitAngle =
                (Math.PI / 180) * customMaths.randInt(0, 360, pSeed);

            pSeed = customMaths.nextSeed(pSeed);

            curRange += customMaths.randInt(2, 8, pSeed);

            const y = customMaths.randInt(0, 5, pSeed + 9) - 2;

            const dir2D = {
                x: Math.sin(orbitAngle),
                y: Math.cos(orbitAngle),
            };
            const len = Math.sqrt((dir2D.x*dir2D.x)+(dir2D.y*dir2D.y))
            const normDir2D = {
                x: dir2D.x / len,
                y: dir2D.y / len
            };

            const dir = {
                x: normDir2D.x,
                y: y,
                z: normDir2D.y,
            };

            // const len = Math.hypot(dir.x, dir.y, dir.z) || 1;

            

            const sSectorPos = {
                x: customMaths.roundToIntUnity(centerPos.x + dir.x * curRange),
                y: customMaths.roundToIntUnity(centerPos.y + dir.y * curRange),
                z: customMaths.roundToIntUnity(centerPos.z + dir.z * curRange),
            };
            // if (isBaseSolarSystem){console.log("centerPos:", centerPos, "orbitA: ", orbitAngle, "curRange: ", curRange, "dir2D:", dir2D, "normdir2D:", normDir2D, "dir:", dir);}
            // if (isBaseSolarSystem){console.log("sectPos: ", sSectorPos);}
            pSeed = customMaths.nextSeed(pSeed);

            let planetRadius = 200;
            let planetType = 0;

            if (!isBaseSolarSystem || p !== basePlanet) {
                planetRadius = customMaths.randInt(50, 300, pSeed);
                planetType = customMaths.randInt(0, refs.dtm.planets.length, pSeed + 71);
            }
            // else {console.log("base planet radius: ", planetRadius);}

            stars[p] = new SimpleStarData(
                sSectorPos,
                planetType,
                planetRadius
            );
        }

        return stars;
    }
}
class SimpleStarData
{
    constructor (pos, planetType, size)
    {
        this.pos = pos;
        this.planetType = planetType;
        this.size=size;
    }
}

class Galaxy {
    static generateGalaxy(uSector, seed, isBase = false) {
        let galaxyType = 0;

        if (isBase) galaxyType = 0;

        if (galaxyType === 0) {
            return this.generateGalaxyType0(seed, uSector, isBase);
        }

        return null;
    }
    static generateGalaxyType0(seed, uSector, isBase = false) {
        const solarSysList = [];

        let curSeed = seed;

        let solSysCount = customMaths.randInt(160, 350, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        const initialRingCount = 70;
        const angleIncrement = 10;
        const spiralRadiusIncrement = 1;

        const armCountRarity = customMaths.randInt(1, 100, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        let maxArmCount = 6;
        if (armCountRarity > 92) maxArmCount = 20;
        else if (armCountRarity > 80) maxArmCount = 15;
        else if (armCountRarity > 50) maxArmCount = 9;

        let armCount = customMaths.randInt(1, maxArmCount, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        const cubesPerArm = Math.floor(solSysCount / armCount);
        const armAngleOffsetInc = 360 / armCount;
        const startingThickness = 16 / armCount;

        const xSquash = customMaths.randInt(75, 100, curSeed) / 100;
        curSeed = customMaths.nextSeed(curSeed);

        const zSquash = customMaths.randInt(75, 100, curSeed) / 100;
        curSeed = customMaths.nextSeed(curSeed);

        const ySquashRarity = customMaths.randInt(1, 100, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        let ySquash = 1;
        if (ySquashRarity > 90) {
            ySquash += (ySquashRarity / 50) + (customMaths.randInt(1, 100, curSeed) / 10);
        }

        let maxLatDir = 0.1;
        if (ySquashRarity > 60) maxLatDir = 0.6;
        else if (ySquashRarity > 30) maxLatDir = 0.3;

        const xRot = customMaths.randInt(0, 360, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        const yRot = customMaths.randInt(0, 360, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        const zRot = customMaths.randInt(0, 360, curSeed);
        curSeed = customMaths.nextSeed(curSeed);

        const galaxyRotation = customMaths.makeEulerRotation(xRot, yRot, zRot);

        let currentRadius = 4;
        let currentAngle = 0;
        let curSpiralLength = 10;
        let curThickness = startingThickness;
        let curThickIndx = 0;
        let curDistAlongArmIndx = 0;
        let curArmAngleOffset = 0;
        let curLatitude = 0;

        let curArmLatitudeDir =
            (customMaths.randInt(0, 100, curSeed) - 50) * 0.01 * maxLatDir;

        let curDeg = 0;
        
        // --------------------------
        // INITIAL RING
        // --------------------------
        for (let i = 0; i < initialRingCount; i++) {
            curSeed = customMaths.nextSeed(curSeed);

            const angleRad = customMaths.f32((curDeg * 10 * Math.PI) / 180);

            const xz = {
                x: (Math.cos(angleRad) * currentRadius),
                y: (Math.sin(angleRad) * currentRadius),
            };

            const yVal = (customMaths.randInt(0, 100, curSeed) - 50) / 25;

            let position = {
                x: (xz.x * xSquash) * 0.8,
                y: (yVal * customMaths.f32(ySquash * 1.4)) * 0.8,
                z: (xz.y * customMaths.f32(zSquash * 0.95) * 0.8),
            };

            position = customMaths.applyRotation(galaxyRotation, position);
            // if (isBase){console.log("pos:", position);}
            const pos = {
                x: customMaths.roundToIntUnity(position.x) + 50,
                y: customMaths.roundToIntUnity(position.y) + 50,
                z: customMaths.roundToIntUnity(position.z) + 50,
            };

            if (customMaths.inBounds(pos)) {

                const sectKey = USect.posToGSectIndex(pos);
                // console.log("sskey:"+sectKey);

                if (!solarSysList.includes(sectKey)) 
                    {
                    solarSysList.push(sectKey);
                }
            }

            curDeg += 10;

            if (curDeg >= 360) {
                curDeg = 0;
                currentRadius += 2;
            }
        }

        // --------------------------
        // SPIRAL ARMS
        // --------------------------
        for (let i = 0; i < solSysCount - initialRingCount; i++) {
            curSeed = customMaths.nextSeed(curSeed);

            currentRadius = curSpiralLength * spiralRadiusIncrement;
            currentAngle = curSpiralLength * (angleIncrement + curThickIndx);

            const angleRad = (currentAngle * Math.PI) / 180;

            let xz = customMaths.rotateVector2(
                {
                    x: Math.cos(angleRad) * currentRadius,
                    y: Math.sin(angleRad) * currentRadius,
                },
                curArmAngleOffset
            );

            let yVal = 0;
            yVal += (customMaths.randInt(0, 100, curSeed) - 50) / 25;
            yVal += curLatitude;

            let position = {
                x: xz.x * xSquash * 0.95,
                y: yVal * ySquash * 1.4,
                z: xz.y * zSquash * 0.95,
            };

            position = customMaths.applyRotation(galaxyRotation, position);

            const pos = {
                x: Math.round(position.x) + 50,
                y: Math.round(position.y) + 50,
                z: Math.round(position.z) + 50,
            };

            if (customMaths.inBounds(pos)) {
                const sectKey = USect.posToGSectIndex(pos);

                if (!solarSysList.includes(sectKey)) 
                    {
                        
                    solarSysList.push(sectKey);
                }
            }

            curThickIndx++;

            if (curThickness <= 0 || curThickIndx % Math.floor(curThickness) === 0) {
                curSpiralLength += 1;
                curThickIndx = 0;
            } else {
                curThickness -= 0.05;
                curLatitude += curArmLatitudeDir;
            }

            curDistAlongArmIndx++;

            if (curDistAlongArmIndx >= cubesPerArm) {
                curLatitude = 0;
                curSeed = customMaths.nextSeed(curSeed);


                curArmLatitudeDir =
                    (customMaths.randInt(0, 100, curSeed) - 50) * 0.01 * maxLatDir;

                curDistAlongArmIndx = 0;
                curSpiralLength = 10;
                curThickness = startingThickness;
                curArmAngleOffset += armAngleOffsetInc;
            }
        }
        
        // --------------------------
        // LEFTOVER RANDOM FILL
        // --------------------------
        const leftoverBlocks = solSysCount - solarSysList.length;
        const indxRange = 100 * 100 * 100;

        for (let i = 0; i < leftoverBlocks; i++) {
            curSeed = customMaths.nextSeed(curSeed);

            const ssKey = customMaths.randInt(0, indxRange, curSeed);


            if (!solarSysList.includes(ssKey)) {
                solarSysList.push(ssKey);
            }
        }
        return solarSysList;
    }
}
export { start, createUniverse, StarBuffer, CosmicHelper};