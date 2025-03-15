class RJMTurtle {
    constructor() {
        this.block = "1";
        this.nib = [[0,0,0]];
        this.pos = [0,0,0];
        this.penDown = true;
        this.matrix = null;
        this.TO_RADIANS = Math.PI / 180;
    }
    
    clone() {
        var t = new RJMTurtle();
        t.block = this.block;
        t.nib = this.nib;
        t.pos = this.pos;
        t.penDown = this.penDown;
        t.matrix = this.matrix;
        return t;
    }
    
    mmMultiply(a,b) {
        var c = [[0,0,0],[0,0,0],[0,0,0]];
        for (var i = 0; i < 3 ; i++) for (var j = 0; j < 3 ; j++)
          c[i][j] = a[i][0]*b[0][j] + a[i][1]*b[1][j] + a[i][2]*b[2][j];
        return c;
    };
    
    mod(n,m) {
        return ((n%m)+m)%m;
    };
    
    cosDegrees(angle) {
        if (this.mod(angle,90) == 0) {
            return [1,0,-1,0][this.mod(angle,360)/90];
        }
        else {
            return Math.cos(angle * this.TO_RADIANS);
        }
    }
    
    sinDegrees(angle) {
        if (this.mod(angle,90) == 0) {
            return [0,1,0,-1][this.mod(angle,360)/90];
        }
        else {
            return Math.sin(angle * this.TO_RADIANS);
        }
    }
    
    yawMatrix(angle) {
        var c = this.cosDegrees(angle);
        var s = this.sinDegrees(angle);
        return [[c, 0, -s],
                [0, 1, 0],
                [s, 0, c]];
    };
    
    rollMatrix(angle) {
        var c = this.cosDegrees(angle);
        var s = this.sinDegrees(angle);
        return [[c, -s, 0],
                [s,  c, 0],
                [0,  0, 1]];
    };
    
    pitchMatrix(angle) {
        var c = this.cosDegrees(angle);
        var s = this.sinDegrees(angle);
        return [[1, 0, 0],
                [0, c, s],
                [0,-s, c]];
    };
}

class FruitJuice {
    constructor(runtime) {
        this.clear();
    }
    
    clear() {
        this.socket = null;
        this.hits = [];
        this.turtle = new RJMTurtle();
        this.turtleHistory = [];
        this.savedBlocks = null;
    }
    
    getInfo() {

// jQuery doesn't work?
//	.getJSON("https://lweb.cfa.harvard.edu/~jeastman/block_id.json",function(items){});

// security issues
//	var request = new XMLHttpRequest();
//	request.open("GET","https://lweb.cfa.harvard.edu/~jeastman/block_id.json");
//	request.send(null);
//	items = JSON.parse(request.responseText);

        return {
            "id": "FruitJuice",
            "name": "Minecraft",
            
            "blocks": [
		{
                    "opcode": "connect_p",
                    "blockType": "command",
                    "text": "connect to Minecraft on [ip] port [port]",
                    "arguments": {
                        "ip": {
                            "type": "string",
                            "defaultValue": "192.168.1.239"
                        },
			"port":{
                            "type": "string",
                            "defaultValue": "14711"
			},
                    }
		},
		{
		    "opcode": "setPlayer",
		    "blockType": "command",
		    "text": "select player [playerName]",
		    "arguments": {
			"playerName": {
			    "type": "string",
			    "defaultValue": ""
			},
		    }
		},
		{
		    "opcode": "chat",
                    "blockType": "command",
                    "text": "say in chat [msg]",
                    "arguments": {
			"msg": {
                            "type": "string",
                            "defaultValue": "Hello from scratch!"
			},
                    }
		},
		{
                    "opcode": "blockByName",
                    "blockType": "reporter",
                    "text": "block id of [name]",
                    "arguments": {
			"name": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                            "menu": "blockMenu"
			}
                    }
		},            
		{
                    "opcode": "getBlock",
                    "blockType": "reporter",
                    "text": "block id at ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                    }
            },
/*            {
                    "opcode": "haveBlock",
                    "blockType": "Boolean",
                    "text": "have [b] at ([x],[y],[z])",
                    "arguments": {
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                            "menu": "blockMenu"
                        },
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                    }
            },             */
/*            {
                    "opcode": "onBlock",
                    "blockType": "Boolean",
                    "text": "player on [b]",
                    "arguments": {
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                            "menu": "blockMenu"
                        },
                    }
            }, */
            {
                    "opcode": "getPlayerX",
                    "blockType": "reporter",
                    "text": "player x [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },            
            {
                    "opcode": "getPlayerY",
                    "blockType": "reporter",
                    "text": "player y [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },            
            {
                    "opcode": "getPlayerZ",
                    "blockType": "reporter",
                    "text": "player z [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },
            {
                    "opcode": "getPlayerVector",
                    "blockType": "reporter",
                    "text": "player vector [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },
            {
                    "opcode": "getTurtleX",
                    "blockType": "reporter",
                    "text": "Turtle x [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },            
            {
                    "opcode": "getTurtleY",
                    "blockType": "reporter",
                    "text": "Turtle y [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },            
            {
                    "opcode": "getTurtleZ",
                    "blockType": "reporter",
                    "text": "Turtle z [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },
            {
                    "opcode": "getTurtleVector",
                    "blockType": "reporter",
                    "text": "Turtle vector [mode] position",
                    "arguments": {
                        "mode": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "modeMenu"
                        },
                    }
            },
/*            {
                    "opcode": "getHit",
                    "blockType": "reporter",
                    "text": "sword hit vector position",
                    "arguments": {
                    }
            },            */
            {
                    "opcode": "extractFromVector",
                    "blockType": "reporter",
                    "text": "[coordinate]-coordinate of vector [vector]",
                    "arguments": {
                        "coordinate": {
                            "type": "number",
                            "defaultValue": 0,
                            "menu": "coordinateMenu"
                        },
                        "vector": {
                            "type": "string",
                            "defaultValue": "0,0,0",
                        },
                    }
            },          
            {
                    "opcode": "makeVector",
                    "blockType": "reporter",
                    "text": "vector ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": 0,
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": 0,
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": 0,
                        },
                    }
            },                
            {
                    "opcode": "setBlock",
                    "blockType": "command",
                    "text": "put [b] at ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone",
                            "menu": "commonMenu"
                        },
                    }
            },            
            {
                    "opcode": "setBlock",
                    "blockType": "command",
                    "text": "put [b] at ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "b": {
                            "type": "number",
                            "defaultValue": "1"
                        },
                    }
            },            
            {
                    "opcode": "setBlock",
                    "blockType": "command",
                    "text": "put [b] at ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                            "menu": "blockMenu"
                        },
                    }
            },            
            {
                    "opcode": "setBlock",
                    "blockType": "command",
                    "text": "put [b] at ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "b": {
                            "type": "string",
                            "defaultValue": "Redstone Wire",
                            "menu": "circuitMenu"
                        },
                    }
            },            
            {
                    "opcode": "setPlayerPos",
                    "blockType": "command",
                    "text": "move player to ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": 0
                        },
                    }
            },            
	    {
                    "opcode": "movePlayer",
                    "blockType": "command",
                    "text": "move player by ([dx],[dy],[dz])",
                    "arguments": {
                        "dx": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "dy": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "dz": {
                            "type": "number",
                            "defaultValue": 0
                        },
                    }
            },         
/*            {
                    "opcode": "movePlayerTop",
                    "blockType": "command",
                    "text": "move player to top",
                    "arguments": {
                    }
            },         */
/*	    {
		    "opcode": "spawnEntity",
                    "blockType": "command",
                    "text": "spawn [entity] at ([x],[y],[z])",
                    "arguments": {
                        "entity": {
                            "type": "number",
                            "defaultValue": "120"
                        },
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                    }
            },*/
            {
                    "opcode": "spawnEntity",
                    "blockType": "command",
                    "text": "spawn [entity] at ([x],[y],[z])",
                    "arguments": {
                        "entity": {
                            "type": "string",
                            "defaultValue": "120", //villager
                            "menu": "entityMenu"
                        },
                        "x": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                    }
            },
            {
                    "opcode": "moveTurtle",
                    "blockType": "command",
                    "text": "turtle [dir] [n]",
                    "arguments": {
                        "dir": {
                            "type": "number",
                            "menu": "moveMenu",
                            "defaultValue": 1
                        },
                        "n": {
                            "type": "number",
                            "defaultValue": "1"
                        },
                    }
            },            
            {
                    "opcode": "leftTurtle",
                    "blockType": "command",
                    "text": "turtle turn left [n] degrees",
                    "arguments": {
                        "n": {
                            "type": "number",
                            "defaultValue": "90"
                        },
                    }
            },            
            {
                    "opcode": "rightTurtle",
                    "blockType": "command",
                    "text": "turtle turn right [n] degrees",
                    "arguments": {
                        "n": {
                            "type": "number",
                            "defaultValue": "90"
                        },
                    }
            },            
            {
                    "opcode": "turnTurtle",
                    "blockType": "command",
                    "text": "turtle [dir] [n] degrees",
                    "arguments": {
                        "dir": {
                            "type": "string",
                            "menu": "turnMenu",
                            "defaultValue": "pitch"
                        },
                        "n": {
                            "type": "number",
                            "defaultValue": "90"
                        },
                    }
            },            
            {
                    "opcode": "pen",
                    "blockType": "command",
                    "text": "turtle pen [state]",
                    "arguments": {
                        "state": {
                            "type": "number",
                            "defaultValue": 1,
                            "menu": "penMenu"
                        }
                    }
            },            
            {
                    "opcode": "turtleBlock",
                    "blockType": "command",
                    "text": "turtle pen block [b]",
                    "arguments": {
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                            "menu": "blockMenu"
                        }
                    }
            },            
            {
                    "opcode": "turtleBlock",
                    "blockType": "command",
                    "text": "turtle pen block with id [b]",
                    "arguments": {
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone (0)",
                        }
                    }
            },
            {
                    "opcode": "turtleBlock",
                    "blockType": "command",
                    "text": "turtle pen block [b]",
                    "arguments": {
                        "b": {
                            "type": "string",
                            "defaultValue": "Stone",
                            "menu": "commonMenu"
                        },
                    }
            },            
            {
                    "opcode": "turtleThickness",
                    "blockType": "command",
                    "text": "turtle pen thickness [n]",
                    "arguments": {
                        "n": {
                            "type": "number",
                            "defaultValue": 1,
                        }
                    }
            },            
            {
                    "opcode": "setTurtlePosition",
                    "blockType": "command",
                    "text": "turtle move to ([x],[y],[z])",
                    "arguments": {
                        "x": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "y": {
                            "type": "number",
                            "defaultValue": 0
                        },
                        "z": {
                            "type": "number",
                            "defaultValue": 0
                        },
                    }
            },            
            {
                    "opcode": "resetTurtleAngle",
                    "blockType": "command",
                    "text": "turtle reset to [n] degrees",
                    "arguments": {
                        "n": {
                            "type": "number",
                            "defaultValue": "0"
                        },
                    }
            },            
/*            {
                    "opcode": "saveTurtle",
                    "blockType": "command",
                    "text": "turtle save",
                    "arguments": {
                    }
            },            
            {
                    "opcode": "restoreTurtle",
                    "blockType": "command",
                    "text": "turtle restore",
                    "arguments": {
                    }
            },            
            {
                    "opcode": "suspend",
                    "blockType": "command",
                    "text": "suspend drawing",
                    "arguments": {
                    }
            },            
            {
                    "opcode": "resume",
                    "blockType": "command",
                    "text": "resume drawing",
                    "arguments": {
                    }
            },          */  
            ],
        "menus": {
            moveMenu: [{text:"forward",value:1}, {text:"back",value:-1}],
            penMenu: [{text:"down",value:1}, {text:"up",value:0}],
            coordinateMenu: [{text:"x",value:0}, {text:"y",value:1}, {text:"z",value:2}],
            turnMenu: [ "yaw", "pitch", "roll" ],
            modeMenu: [{text:"exact",value:1},{text:"block",value:0}],
            entityMenu: 
	    [
		{text:"Item",value:1},
		{text:"XPOrb",value:2},
                {text:"AreaEffectCloud",value:3},
		{text:"ElderGuardian",value:4},
		{text:"WitherSkeleton",value:5},
		{text:"Stray",value:6},
		{text:"Egg",value:7},
                {text:"LeashKnot",value:8},
                {text:"Painting",value:9},
                {text:"Arrow",value:10},
                {text:"Snowball",value:11},
                {text:"Fireball",value:12},
                {text:"SmallFireball",value:13},
                {text:"ThrownEnderpearl",value:14},
                {text:"EyeOfEnderSignal",value:15},
                {text:"ThrownPotion",value:16},
                {text:"ThrownExpBottle",value:17},
                {text:"ItemFrame",value:18},
                {text:"WitherSkull",value:19},
                {text:"PrimedTnt",value:20},
                {text:"FallingSand",value:21},
                {text:"FireworksRocketEntity",value:22},
                {text:"Husk",value:23},
                {text:"SpectralArrow",value:24},
                {text:"ShulkerBullet",value:25},
                {text:"DragonFireball",value:26},
                {text:"ZombieVillager",value:27},
                {text:"SkeletonHorse",value:28},
                {text:"ZombieHorse",value:29},
                {text:"ArmorStand",value:30},
                {text:"Donkey",value:31},
                {text:"Mule",value:32},
                {text:"EvocationFangs",value:33},
                {text:"EvocationIllager",value:34},
                {text:"Vex",value:35},
                {text:"VindicationIllager",value:36},
                {text:"IllusionIllager",value:37},
                {text:"MinecartCommandBlock",value:40},
                {text:"Boat",value:41},
                {text:"MinecartRideable",value:42},
                {text:"MinecartChest",value:43},
                {text:"MinecartFurnace",value:44},
                {text:"MinecartTNT",value:45},
                {text:"MinecartHopper",value:46},
                {text:"MinecartSpawner",value:47},
                {text:"Creeper",value:50},
                {text:"Skeleton",value:51},
                {text:"Spider",value:52},
                {text:"Giant",value:53},
                {text:"Zombie",value:54},
                {text:"Slime",value:55},
                {text:"Ghast",value:56},
                {text:"PigZombie",value:57},
                {text:"Enderman",value:58},
                {text:"CaveSpider",value:59},
                {text:"Silverfish",value:60},
                {text:"Blaze",value:61},
                {text:"LavaSlime",value:62},
                {text:"EnderDragon",value:63},
                {text:"WitherBoss",value:64},
                {text:"Bat",value:65},
                {text:"Witch",value:66},
                {text:"Endermite",value:67},
                {text:"Guardian",value:68},
                {text:"Shulker",value:69},		
                {text:"Pig",value:90},
                {text:"Sheep",value:91},
                {text:"Cow",value:92},
                {text:"Chicken",value:93},
                {text:"Squid",value:94},
                {text:"Wolf",value:95},
                {text:"MushroomCow",value:96},
                {text:"SnowMan",value:97},
                {text:"Ozelot",value:98},
                {text:"Golem",value:99},
                {text:"Horse",value:100},
                {text:"Rabbit",value:101},
                {text:"PolarBear",value:102},
                {text:"Llama",value:103},
                {text:"LlamaSpit",value:104},
                {text:"Parrot",value:105},
                {text:"Villager",value:120},
                {text:"EnderCrystal",value:200},
	    ],
	    circuitMenu: { acceptReporters: true,
		items: [
		    {text:"Stone",value:"STONE"},
		    {text:"Redstone Wire",value:"REDSTONE_WIRE"},
		    {text:"Redstone Torch",value:"REDSTONE_TORCH"},
		    {text:"Redstone Repeater",value:"REPEATER"},
		    {text:"Redstone Comparator",value:"COMPARATOR"},
		    {text:"Piston",value:"PISTON"},
		    {text:"Lever",value:"LEVER"},
		    {text:"White Wool",value:"WHITE_WOOL"},
		    {text:"Orange Wool",value:"ORANGE_WOOL"},
		    {text:"Magenta Wool",value:"MAGENTA_WOOL"},
		    {text:"Light Blue Wool",value:"LIGHT_BLUE_WOOL"},
		    {text:"Yellow Wool",value:"YELLOW_WOOL"},
		    {text:"Lime Wool",value:"LIME_WOOL"},
		    {text:"Pink Wool",value:"PINK_WOOL"},
		    {text:"Gray Wool",value:"GRAY_WOOL"},
		    {text:"Light Gray Wool",value:"LIGHT_GRAY_WOOL"},
		    {text:"Cyan Wool",value:"CYAN_WOOL"},
		    {text:"Purple Wool",value:"PURPLE_WOOL"},
		    {text:"Blue Wool",value:"BLUE_WOOL"},
		    {text:"Brown Wool",value:"BROWN_WOOL"},
		    {text:"Green Wool",value:"GREEN_WOOL"},
		    {text:"Red Wool",value:"RED_WOOL"},
		    {text:"Black Wool",value:"BLACK_WOOL"},
		],
			 },
	    commonMenu: { acceptReporters: true,
		items: [
		    {text:"Stone",value:"STONE"},
		    {text:"Air",value:"AIR"},
		    {text:"Water",value:"WATER"},
		    {text:"Sand",value:"SAND"},
		    {text:"Block of Raw Gold",value:"RAW_GOLD_BLOCK"},
		    {text:"Block of Iron",value:"IRON_BLOCK"},
		    {text:"Block of Gold",value:"GOLD_BLOCK"},
		    {text:"Block of Diamond",value:"DIAMOND_BLOCK"},
		    {text:"Block of Netherite",value:"NETHERITE_BLOCK"},
		    {text:"White Wool",value:"WHITE_WOOL"},
		    {text:"Orange Wool",value:"ORANGE_WOOL"},
		    {text:"Magenta Wool",value:"MAGENTA_WOOL"},
		    {text:"Light Blue Wool",value:"LIGHT_BLUE_WOOL"},
		    {text:"Yellow Wool",value:"YELLOW_WOOL"},
		    {text:"Lime Wool",value:"LIME_WOOL"},
		    {text:"Pink Wool",value:"PINK_WOOL"},
		    {text:"Gray Wool",value:"GRAY_WOOL"},
		    {text:"Light Gray Wool",value:"LIGHT_GRAY_WOOL"},
		    {text:"Cyan Wool",value:"CYAN_WOOL"},
		    {text:"Purple Wool",value:"PURPLE_WOOL"},
		    {text:"Blue Wool",value:"BLUE_WOOL"},
		    {text:"Brown Wool",value:"BROWN_WOOL"},
		    {text:"Green Wool",value:"GREEN_WOOL"},
		    {text:"Red Wool",value:"RED_WOOL"},
		    {text:"Black Wool",value:"BLACK_WOOL"},
		],
			},
            blockMenu: { acceptReporters: true,
		items: [
		    {text:"Stone (0)",value:"STONE"},
		    {text:"Granite (1)",value:"GRANITE"},
		    {text:"Polished Granite (2)",value:"POLISHED_GRANITE"},
		    {text:"Diorite (3)",value:"DIORITE"},
		    {text:"Polished Diorite (4)",value:"POLISHED_DIORITE"},
		    {text:"Andesite (5)",value:"ANDESITE"},
		    {text:"Polished Andesite (6)",value:"POLISHED_ANDESITE"},
		    {text:"Deepslate (7)",value:"DEEPSLATE"},
		    {text:"Cobbled Deepslate (8)",value:"COBBLED_DEEPSLATE"},
		    {text:"Polished Deepslate (9)",value:"POLISHED_DEEPSLATE"},
		    {text:"Calcite (10)",value:"CALCITE"},
		    {text:"Tuff (11)",value:"TUFF"},
		    {text:"Dripstone Block (12)",value:"DRIPSTONE_BLOCK"},
		    {text:"Grass Block (13)",value:"GRASS_BLOCK"},
		    {text:"Dirt (14)",value:"DIRT"},
		    {text:"Coarse Dirt (15)",value:"COARSE_DIRT"},
		    {text:"Podzol (16)",value:"PODZOL"},
		    {text:"Rooted Dirt (17)",value:"ROOTED_DIRT"},
		    {text:"Mud (18)",value:"MUD"},
		    {text:"Crimson Nylium (19)",value:"CRIMSON_NYLIUM"},
		    {text:"Warped Nylium (20)",value:"WARPED_NYLIUM"},
		    {text:"Cobblestone (21)",value:"COBBLESTONE"},
		    {text:"Oak Planks (22)",value:"OAK_PLANKS"},
		    {text:"Spruce Planks (23)",value:"SPRUCE_PLANKS"},
		    {text:"Birch Planks (24)",value:"BIRCH_PLANKS"},
		    {text:"Jungle Planks (25)",value:"JUNGLE_PLANKS"},
		    {text:"Acacia Planks (26)",value:"ACACIA_PLANKS"},
		    {text:"Dark Oak Planks (27)",value:"DARK_OAK_PLANKS"},
		    {text:"Mangrove Planks (28)",value:"MANGROVE_PLANKS"},
		    {text:"Crimson Planks (29)",value:"CRIMSON_PLANKS"},
		    {text:"Warped Planks (30)",value:"WARPED_PLANKS"},
		    {text:"Oak Sapling (31)",value:"OAK_SAPLING"},
		    {text:"Spruce Sapling (32)",value:"SPRUCE_SAPLING"},
		    {text:"Birch Sapling (33)",value:"BIRCH_SAPLING"},
		    {text:"Jungle Sapling (34)",value:"JUNGLE_SAPLING"},
		    {text:"Acacia Sapling (35)",value:"ACACIA_SAPLING"},
		    {text:"Dark Oak Sapling (36)",value:"DARK_OAK_SAPLING"},
		    {text:"Mangrove Propagule (37)",value:"MANGROVE_PROPAGULE"},
		    {text:"Sand (38)",value:"SAND"},
		    {text:"Red Sand (39)",value:"RED_SAND"},
		    {text:"Gravel (40)",value:"GRAVEL"},
		    {text:"Coal Ore (41)",value:"COAL_ORE"},
		    {text:"Deepslate Coal Ore (42)",value:"DEEPSLATE_COAL_ORE"},
		    {text:"Iron Ore (43)",value:"IRON_ORE"},
		    {text:"Deepslate Iron Ore (44)",value:"DEEPSLATE_IRON_ORE"},
		    {text:"Copper Ore (45)",value:"COPPER_ORE"},
		    {text:"Deepslate Copper Ore (46)",value:"DEEPSLATE_COPPER_ORE"},
		    {text:"Gold Ore (47)",value:"GOLD_ORE"},
		    {text:"Deepslate Gold Ore (48)",value:"DEEPSLATE_GOLD_ORE"},
		    {text:"Redstone Ore (49)",value:"REDSTONE_ORE"},
		    {text:"Deepslate Redstone Ore (50)",value:"DEEPSLATE_REDSTONE_ORE"},
		    {text:"Emerald Ore (51)",value:"EMERALD_ORE"},
		    {text:"Deepslate Emerald Ore (52)",value:"DEEPSLATE_EMERALD_ORE"},
		    {text:"Lapis Lazuli Ore (53)",value:"LAPIS_ORE"},
		    {text:"Deepslate Lapis Lazuli Ore (54)",value:"DEEPSLATE_LAPIS_ORE"},
		    {text:"Diamond Ore (55)",value:"DIAMOND_ORE"},
		    {text:"Deepslate Diamond Ore (56)",value:"DEEPSLATE_DIAMOND_ORE"},
		    {text:"Nether Gold Ore (57)",value:"NETHER_GOLD_ORE"},
		    {text:"Nether Quartz Ore (58)",value:"NETHER_QUARTZ_ORE"},
		    {text:"Ancient Debris (59)",value:"ANCIENT_DEBRIS"},
		    {text:"Block of Coal (60)",value:"COAL_BLOCK"},
		    {text:"Block of Raw Iron (61)",value:"RAW_IRON_BLOCK"},
		    {text:"Block of Raw Copper (62)",value:"RAW_COPPER_BLOCK"},
		    {text:"Block of Raw Gold (63)",value:"RAW_GOLD_BLOCK"},
		    {text:"Block of Amethyst (64)",value:"AMETHYST_BLOCK"},
		    {text:"Block of Iron (65)",value:"IRON_BLOCK"},
		    {text:"Block of Copper (66)",value:"COPPER_BLOCK"},
		    {text:"Block of Gold (67)",value:"GOLD_BLOCK"},
		    {text:"Block of Diamond (68)",value:"DIAMOND_BLOCK"},
		    {text:"Block of Netherite (69)",value:"NETHERITE_BLOCK"},
		    {text:"Exposed Copper (70)",value:"EXPOSED_COPPER"},
		    {text:"Weathered Copper (71)",value:"WEATHERED_COPPER"},
		    {text:"Oxidized Copper (72)",value:"OXIDIZED_COPPER"},
		    {text:"Cut Copper (73)",value:"CUT_COPPER"},
		    {text:"Exposed Cut Copper (74)",value:"EXPOSED_CUT_COPPER"},
		    {text:"Weathered Cut Copper (75)",value:"WEATHERED_CUT_COPPER"},
		    {text:"Oxidized Cut Copper (76)",value:"OXIDIZED_CUT_COPPER"},
		    {text:"Cut Copper Stairs (77)",value:"CUT_COPPER_STAIRS"},
		    {text:"Exposed Cut Copper Stairs (78)",value:"EXPOSED_CUT_COPPER_STAIRS"},
		    {text:"Weathered Cut Copper Stairs (79)",value:"WEATHERED_CUT_COPPER_STAIRS"},
		    {text:"Oxidized Cut Copper Stairs (80)",value:"OXIDIZED_CUT_COPPER_STAIRS"},
		    {text:"Cut Copper Slab (81)",value:"CUT_COPPER_SLAB"},
		    {text:"Exposed Cut Copper Slab (82)",value:"EXPOSED_CUT_COPPER_SLAB"},
		    {text:"Weathered Cut Copper Slab (83)",value:"WEATHERED_CUT_COPPER_SLAB"},
		    {text:"Oxidized Cut Copper Slab (84)",value:"OXIDIZED_CUT_COPPER_SLAB"},
		    {text:"Waxed Block of Copper (85)",value:"WAXED_COPPER_BLOCK"},
		    {text:"Waxed Exposed Copper (86)",value:"WAXED_EXPOSED_COPPER"},
		    {text:"Waxed Weathered Copper (87)",value:"WAXED_WEATHERED_COPPER"},
		    {text:"Waxed Oxidized Copper (88)",value:"WAXED_OXIDIZED_COPPER"},
		    {text:"Waxed Cut Copper (89)",value:"WAXED_CUT_COPPER"},
		    {text:"Waxed Exposed Cut Copper (90)",value:"WAXED_EXPOSED_CUT_COPPER"},
		    {text:"Waxed Weathered Cut Copper (91)",value:"WAXED_WEATHERED_CUT_COPPER"},
		    {text:"Waxed Oxidized Cut Copper (92)",value:"WAXED_OXIDIZED_CUT_COPPER"},
		    {text:"Waxed Cut Copper Stairs (93)",value:"WAXED_CUT_COPPER_STAIRS"},
		    {text:"Waxed Exposed Cut Copper Stairs (94)",value:"WAXED_EXPOSED_CUT_COPPER_STAIRS"},
		    {text:"Waxed Weathered Cut Copper Stairs (95)",value:"WAXED_WEATHERED_CUT_COPPER_STAIRS"},
		    {text:"Waxed Oxidized Cut Copper Stairs (96)",value:"WAXED_OXIDIZED_CUT_COPPER_STAIRS"},
		    {text:"Waxed Cut Copper Slab (97)",value:"WAXED_CUT_COPPER_SLAB"},
		    {text:"Waxed Exposed Cut Copper Slab (98)",value:"WAXED_EXPOSED_CUT_COPPER_SLAB"},
		    {text:"Waxed Weathered Cut Copper Slab (99)",value:"WAXED_WEATHERED_CUT_COPPER_SLAB"},
		    {text:"Waxed Oxidized Cut Copper Slab (100)",value:"WAXED_OXIDIZED_CUT_COPPER_SLAB"},
		    {text:"Oak Log (101)",value:"OAK_LOG"},
		    {text:"Spruce Log (102)",value:"SPRUCE_LOG"},
		    {text:"Birch Log (103)",value:"BIRCH_LOG"},
		    {text:"Jungle Log (104)",value:"JUNGLE_LOG"},
		    {text:"Acacia Log (105)",value:"ACACIA_LOG"},
		    {text:"Dark Oak Log (106)",value:"DARK_OAK_LOG"},
		    {text:"Mangrove Log (107)",value:"MANGROVE_LOG"},
		    {text:"Mangrove Roots (108)",value:"MANGROVE_ROOTS"},
		    {text:"Muddy Mangrove Roots (109)",value:"MUDDY_MANGROVE_ROOTS"},
		    {text:"Crimson Stem (110)",value:"CRIMSON_STEM"},
		    {text:"Warped Stem (111)",value:"WARPED_STEM"},
		    {text:"Stripped Oak Log (112)",value:"STRIPPED_OAK_LOG"},
		    {text:"Stripped Spruce Log (113)",value:"STRIPPED_SPRUCE_LOG"},
		    {text:"Stripped Birch Log (114)",value:"STRIPPED_BIRCH_LOG"},
		    {text:"Stripped Jungle Log (115)",value:"STRIPPED_JUNGLE_LOG"},
		    {text:"Stripped Acacia Log (116)",value:"STRIPPED_ACACIA_LOG"},
		    {text:"Stripped Dark Oak Log (117)",value:"STRIPPED_DARK_OAK_LOG"},
		    {text:"Stripped Mangrove Log (118)",value:"STRIPPED_MANGROVE_LOG"},
		    {text:"Stripped Crimson Stem (119)",value:"STRIPPED_CRIMSON_STEM"},
		    {text:"Stripped Warped Stem (120)",value:"STRIPPED_WARPED_STEM"},
		    {text:"Stripped Oak Wood (121)",value:"STRIPPED_OAK_WOOD"},
		    {text:"Stripped Spruce Wood (122)",value:"STRIPPED_SPRUCE_WOOD"},
		    {text:"Stripped Birch Wood (123)",value:"STRIPPED_BIRCH_WOOD"},
		    {text:"Stripped Jungle Wood (124)",value:"STRIPPED_JUNGLE_WOOD"},
		    {text:"Stripped Acacia Wood (125)",value:"STRIPPED_ACACIA_WOOD"},
		    {text:"Stripped Dark Oak Wood (126)",value:"STRIPPED_DARK_OAK_WOOD"},
		    {text:"Stripped Mangrove Wood (127)",value:"STRIPPED_MANGROVE_WOOD"},
		    {text:"Stripped Crimson Hyphae (128)",value:"STRIPPED_CRIMSON_HYPHAE"},
		    {text:"Stripped Warped Hyphae (129)",value:"STRIPPED_WARPED_HYPHAE"},
		    {text:"Oak Wood (130)",value:"OAK_WOOD"},
		    {text:"Spruce Wood (131)",value:"SPRUCE_WOOD"},
		    {text:"Birch Wood (132)",value:"BIRCH_WOOD"},
		    {text:"Jungle Wood (133)",value:"JUNGLE_WOOD"},
		    {text:"Acacia Wood (134)",value:"ACACIA_WOOD"},
		    {text:"Dark Oak Wood (135)",value:"DARK_OAK_WOOD"},
		    {text:"Mangrove Wood (136)",value:"MANGROVE_WOOD"},
		    {text:"Crimson Hyphae (137)",value:"CRIMSON_HYPHAE"},
		    {text:"Warped Hyphae (138)",value:"WARPED_HYPHAE"},
		    {text:"Oak Leaves (139)",value:"OAK_LEAVES"},
		    {text:"Spruce Leaves (140)",value:"SPRUCE_LEAVES"},
		    {text:"Birch Leaves (141)",value:"BIRCH_LEAVES"},
		    {text:"Jungle Leaves (142)",value:"JUNGLE_LEAVES"},
		    {text:"Acacia Leaves (143)",value:"ACACIA_LEAVES"},
		    {text:"Dark Oak Leaves (144)",value:"DARK_OAK_LEAVES"},
		    {text:"Mangrove Leaves (145)",value:"MANGROVE_LEAVES"},
		    {text:"Azalea Leaves (146)",value:"AZALEA_LEAVES"},
		    {text:"Flowering Azalea Leaves (147)",value:"FLOWERING_AZALEA_LEAVES"},
		    {text:"Sponge (148)",value:"SPONGE"},
		    {text:"Wet Sponge (149)",value:"WET_SPONGE"},
		    {text:"Glass (150)",value:"GLASS"},
		    {text:"Tinted Glass (151)",value:"TINTED_GLASS"},
		    {text:"Block of Lapis Lazuli (152)",value:"LAPIS_BLOCK"},
		    {text:"Sandstone (153)",value:"SANDSTONE"},
		    {text:"Chiseled Sandstone (154)",value:"CHISELED_SANDSTONE"},
		    {text:"Cut Sandstone (155)",value:"CUT_SANDSTONE"},
		    {text:"Cobweb (156)",value:"COBWEB"},
		    {text:"Grass (157)",value:"GRASS"},
		    {text:"Fern (158)",value:"FERN"},
		    {text:"Azalea (159)",value:"AZALEA"},
		    {text:"Flowering Azalea (160)",value:"FLOWERING_AZALEA"},
		    {text:"Dead Bush (161)",value:"DEAD_BUSH"},
		    {text:"Seagrass (162)",value:"SEAGRASS"},
		    {text:"Sea Pickle (163)",value:"SEA_PICKLE"},
		    {text:"White Wool (164)",value:"WHITE_WOOL"},
		    {text:"Orange Wool (165)",value:"ORANGE_WOOL"},
		    {text:"Magenta Wool (166)",value:"MAGENTA_WOOL"},
		    {text:"Light Blue Wool (167)",value:"LIGHT_BLUE_WOOL"},
		    {text:"Yellow Wool (168)",value:"YELLOW_WOOL"},
		    {text:"Lime Wool (169)",value:"LIME_WOOL"},
		    {text:"Pink Wool (170)",value:"PINK_WOOL"},
		    {text:"Gray Wool (171)",value:"GRAY_WOOL"},
		    {text:"Light Gray Wool (172)",value:"LIGHT_GRAY_WOOL"},
		    {text:"Cyan Wool (173)",value:"CYAN_WOOL"},
		    {text:"Purple Wool (174)",value:"PURPLE_WOOL"},
		    {text:"Blue Wool (175)",value:"BLUE_WOOL"},
		    {text:"Brown Wool (176)",value:"BROWN_WOOL"},
		    {text:"Green Wool (177)",value:"GREEN_WOOL"},
		    {text:"Red Wool (178)",value:"RED_WOOL"},
		    {text:"Black Wool (179)",value:"BLACK_WOOL"},
		    {text:"Dandelion (180)",value:"DANDELION"},
		    {text:"Poppy (181)",value:"POPPY"},
		    {text:"Blue Orchid (182)",value:"BLUE_ORCHID"},
		    {text:"Allium (183)",value:"ALLIUM"},
		    {text:"Azure Bluet (184)",value:"AZURE_BLUET"},
		    {text:"Red Tulip (185)",value:"RED_TULIP"},
		    {text:"Orange Tulip (186)",value:"ORANGE_TULIP"},
		    {text:"White Tulip (187)",value:"WHITE_TULIP"},
		    {text:"Pink Tulip (188)",value:"PINK_TULIP"},
		    {text:"Oxeye Daisy (189)",value:"OXEYE_DAISY"},
		    {text:"Cornflower (190)",value:"CORNFLOWER"},
		    {text:"Lily of the Valley (191)",value:"LILY_OF_THE_VALLEY"},
		    {text:"Wither Rose (192)",value:"WITHER_ROSE"},
		    {text:"Spore Blossom (193)",value:"SPORE_BLOSSOM"},
		    {text:"Brown Mushroom (194)",value:"BROWN_MUSHROOM"},
		    {text:"Red Mushroom (195)",value:"RED_MUSHROOM"},
		    {text:"Crimson Fungus (196)",value:"CRIMSON_FUNGUS"},
		    {text:"Warped Fungus (197)",value:"WARPED_FUNGUS"},
		    {text:"Crimson Roots (198)",value:"CRIMSON_ROOTS"},
		    {text:"Warped Roots (199)",value:"WARPED_ROOTS"},
		    {text:"Nether Sprouts (200)",value:"NETHER_SPROUTS"},
		    {text:"Weeping Vines (201)",value:"WEEPING_VINES"},
		    {text:"Twisting Vines (202)",value:"TWISTING_VINES"},
		    {text:"Sugar Cane (203)",value:"SUGAR_CANE"},
		    {text:"Kelp (204)",value:"KELP"},
		    {text:"Moss Carpet (205)",value:"MOSS_CARPET"},
		    {text:"Moss Block (206)",value:"MOSS_BLOCK"},
		    {text:"Hanging Roots (207)",value:"HANGING_ROOTS"},
		    {text:"Big Dripleaf (208)",value:"BIG_DRIPLEAF"},
		    {text:"Small Dripleaf (209)",value:"SMALL_DRIPLEAF"},
		    {text:"Bamboo (210)",value:"BAMBOO"},
		    {text:"Oak Slab (211)",value:"OAK_SLAB"},
		    {text:"Spruce Slab (212)",value:"SPRUCE_SLAB"},
		    {text:"Birch Slab (213)",value:"BIRCH_SLAB"},
		    {text:"Jungle Slab (214)",value:"JUNGLE_SLAB"},
		    {text:"Acacia Slab (215)",value:"ACACIA_SLAB"},
		    {text:"Dark Oak Slab (216)",value:"DARK_OAK_SLAB"},
		    {text:"Mangrove Slab (217)",value:"MANGROVE_SLAB"},
		    {text:"Crimson Slab (218)",value:"CRIMSON_SLAB"},
		    {text:"Warped Slab (219)",value:"WARPED_SLAB"},
		    {text:"Stone Slab (220)",value:"STONE_SLAB"},
		    {text:"Smooth Stone Slab (221)",value:"SMOOTH_STONE_SLAB"},
		    {text:"Sandstone Slab (222)",value:"SANDSTONE_SLAB"},
		    {text:"Cut Sandstone Slab (223)",value:"CUT_SANDSTONE_SLAB"},
		    {text:"Cobblestone Slab (224)",value:"COBBLESTONE_SLAB"},
		    {text:"Brick Slab (225)",value:"BRICK_SLAB"},
		    {text:"Stone Brick Slab (226)",value:"STONE_BRICK_SLAB"},
		    {text:"Mud Brick Slab (227)",value:"MUD_BRICK_SLAB"},
		    {text:"Nether Brick Slab (228)",value:"NETHER_BRICK_SLAB"},
		    {text:"Quartz Slab (229)",value:"QUARTZ_SLAB"},
		    {text:"Red Sandstone Slab (230)",value:"RED_SANDSTONE_SLAB"},
		    {text:"Cut Red Sandstone Slab (231)",value:"CUT_RED_SANDSTONE_SLAB"},
		    {text:"Purpur Slab (232)",value:"PURPUR_SLAB"},
		    {text:"Prismarine Slab (233)",value:"PRISMARINE_SLAB"},
		    {text:"Prismarine Brick Slab (234)",value:"PRISMARINE_BRICK_SLAB"},
		    {text:"Dark Prismarine Slab (235)",value:"DARK_PRISMARINE_SLAB"},
		    {text:"Smooth Quartz Block (236)",value:"SMOOTH_QUARTZ"},
		    {text:"Smooth Red Sandstone (237)",value:"SMOOTH_RED_SANDSTONE"},
		    {text:"Smooth Sandstone (238)",value:"SMOOTH_SANDSTONE"},
		    {text:"Smooth Stone (239)",value:"SMOOTH_STONE"},
		    {text:"Bricks (240)",value:"BRICKS"},
		    {text:"Bookshelf (241)",value:"BOOKSHELF"},
		    {text:"Mossy Cobblestone (242)",value:"MOSSY_COBBLESTONE"},
		    {text:"Obsidian (243)",value:"OBSIDIAN"},
		    {text:"Torch (244)",value:"TORCH"},
		    {text:"End Rod (245)",value:"END_ROD"},
		    {text:"Chorus Flower (246)",value:"CHORUS_FLOWER"},
		    {text:"Purpur Block (247)",value:"PURPUR_BLOCK"},
		    {text:"Purpur Pillar (248)",value:"PURPUR_PILLAR"},
		    {text:"Purpur Stairs (249)",value:"PURPUR_STAIRS"},
		    {text:"Chest (250)",value:"CHEST"},
		    {text:"Crafting Table (251)",value:"CRAFTING_TABLE"},
		    {text:"Furnace (252)",value:"FURNACE"},
		    {text:"Ladder (253)",value:"LADDER"},
		    {text:"Cobblestone Stairs (254)",value:"COBBLESTONE_STAIRS"},
		    {text:"Snow (255)",value:"SNOW"},
		    {text:"Ice (256)",value:"ICE"},
		    {text:"Snow Block (257)",value:"SNOW_BLOCK"},
		    {text:"Cactus (258)",value:"CACTUS"},
		    {text:"Clay (259)",value:"CLAY"},
		    {text:"Jukebox (260)",value:"JUKEBOX"},
		    {text:"Oak Fence (261)",value:"OAK_FENCE"},
		    {text:"Spruce Fence (262)",value:"SPRUCE_FENCE"},
		    {text:"Birch Fence (263)",value:"BIRCH_FENCE"},
		    {text:"Jungle Fence (264)",value:"JUNGLE_FENCE"},
		    {text:"Acacia Fence (265)",value:"ACACIA_FENCE"},
		    {text:"Dark Oak Fence (266)",value:"DARK_OAK_FENCE"},
		    {text:"Mangrove Fence (267)",value:"MANGROVE_FENCE"},
		    {text:"Crimson Fence (268)",value:"CRIMSON_FENCE"},
		    {text:"Warped Fence (269)",value:"WARPED_FENCE"},
		    {text:"Pumpkin (270)",value:"PUMPKIN"},
		    {text:"Carved Pumpkin (271)",value:"CARVED_PUMPKIN"},
		    {text:"Jack o'Lantern (272)",value:"JACK_O_LANTERN"},
		    {text:"Netherrack (273)",value:"NETHERRACK"},
		    {text:"Soul Sand (274)",value:"SOUL_SAND"},
		    {text:"Soul Soil (275)",value:"SOUL_SOIL"},
		    {text:"Basalt (276)",value:"BASALT"},
		    {text:"Polished Basalt (277)",value:"POLISHED_BASALT"},
		    {text:"Smooth Basalt (278)",value:"SMOOTH_BASALT"},
		    {text:"Soul Torch (279)",value:"SOUL_TORCH"},
		    {text:"Glowstone (280)",value:"GLOWSTONE"},
		    {text:"Stone Bricks (281)",value:"STONE_BRICKS"},
		    {text:"Mossy Stone Bricks (282)",value:"MOSSY_STONE_BRICKS"},
		    {text:"Cracked Stone Bricks (283)",value:"CRACKED_STONE_BRICKS"},
		    {text:"Chiseled Stone Bricks (284)",value:"CHISELED_STONE_BRICKS"},
		    {text:"Packed Mud (285)",value:"PACKED_MUD"},
		    {text:"Mud Bricks (286)",value:"MUD_BRICKS"},
		    {text:"Deepslate Bricks (287)",value:"DEEPSLATE_BRICKS"},
		    {text:"Cracked Deepslate Bricks (288)",value:"CRACKED_DEEPSLATE_BRICKS"},
		    {text:"Deepslate Tiles (289)",value:"DEEPSLATE_TILES"},
		    {text:"Cracked Deepslate Tiles (290)",value:"CRACKED_DEEPSLATE_TILES"},
		    {text:"Chiseled Deepslate (291)",value:"CHISELED_DEEPSLATE"},
		    {text:"Brown Mushroom Block (292)",value:"BROWN_MUSHROOM_BLOCK"},
		    {text:"Red Mushroom Block (293)",value:"RED_MUSHROOM_BLOCK"},
		    {text:"Mushroom Stem (294)",value:"MUSHROOM_STEM"},
		    {text:"Iron Bars (295)",value:"IRON_BARS"},
		    {text:"Chain (296)",value:"CHAIN"},
		    {text:"Glass Pane (297)",value:"GLASS_PANE"},
		    {text:"Melon (298)",value:"MELON"},
		    {text:"Vines (299)",value:"VINE"},
		    {text:"Glow Lichen (300)",value:"GLOW_LICHEN"},
		    {text:"Brick Stairs (301)",value:"BRICK_STAIRS"},
		    {text:"Stone Brick Stairs (302)",value:"STONE_BRICK_STAIRS"},
		    {text:"Mud Brick Stairs (303)",value:"MUD_BRICK_STAIRS"},
		    {text:"Mycelium (304)",value:"MYCELIUM"},
		    {text:"Lily Pad (305)",value:"LILY_PAD"},
		    {text:"Nether Bricks (306)",value:"NETHER_BRICKS"},
		    {text:"Cracked Nether Bricks (307)",value:"CRACKED_NETHER_BRICKS"},
		    {text:"Chiseled Nether Bricks (308)",value:"CHISELED_NETHER_BRICKS"},
		    {text:"Nether Brick Fence (309)",value:"NETHER_BRICK_FENCE"},
		    {text:"Nether Brick Stairs (310)",value:"NETHER_BRICK_STAIRS"},
		    {text:"Sculk (311)",value:"SCULK"},
		    {text:"Sculk Vein (312)",value:"SCULK_VEIN"},
		    {text:"Sculk Catalyst (313)",value:"SCULK_CATALYST"},
		    {text:"Sculk Shrieker (314)",value:"SCULK_SHRIEKER"},
		    {text:"Enchanting Table (315)",value:"ENCHANTING_TABLE"},
		    {text:"End Stone (316)",value:"END_STONE"},
		    {text:"End Stone Bricks (317)",value:"END_STONE_BRICKS"},
		    {text:"Dragon Egg (318)",value:"DRAGON_EGG"},
		    {text:"Sandstone Stairs (319)",value:"SANDSTONE_STAIRS"},
		    {text:"Ender Chest (320)",value:"ENDER_CHEST"},
		    {text:"Block of Emerald (321)",value:"EMERALD_BLOCK"},
		    {text:"Oak Stairs (322)",value:"OAK_STAIRS"},
		    {text:"Spruce Stairs (323)",value:"SPRUCE_STAIRS"},
		    {text:"Birch Stairs (324)",value:"BIRCH_STAIRS"},
		    {text:"Jungle Stairs (325)",value:"JUNGLE_STAIRS"},
		    {text:"Acacia Stairs (326)",value:"ACACIA_STAIRS"},
		    {text:"Dark Oak Stairs (327)",value:"DARK_OAK_STAIRS"},
		    {text:"Mangrove Stairs (328)",value:"MANGROVE_STAIRS"},
		    {text:"Crimson Stairs (329)",value:"CRIMSON_STAIRS"},
		    {text:"Warped Stairs (330)",value:"WARPED_STAIRS"},
		    {text:"Beacon (331)",value:"BEACON"},
		    {text:"Cobblestone Wall (332)",value:"COBBLESTONE_WALL"},
		    {text:"Mossy Cobblestone Wall (333)",value:"MOSSY_COBBLESTONE_WALL"},
		    {text:"Brick Wall (334)",value:"BRICK_WALL"},
		    {text:"Prismarine Wall (335)",value:"PRISMARINE_WALL"},
		    {text:"Red Sandstone Wall (336)",value:"RED_SANDSTONE_WALL"},
		    {text:"Mossy Stone Brick Wall (337)",value:"MOSSY_STONE_BRICK_WALL"},
		    {text:"Granite Wall (338)",value:"GRANITE_WALL"},
		    {text:"Stone Brick Wall (339)",value:"STONE_BRICK_WALL"},
		    {text:"Mud Brick Wall (340)",value:"MUD_BRICK_WALL"},
		    {text:"Nether Brick Wall (341)",value:"NETHER_BRICK_WALL"},
		    {text:"Andesite Wall (342)",value:"ANDESITE_WALL"},
		    {text:"Red Nether Brick Wall (343)",value:"RED_NETHER_BRICK_WALL"},
		    {text:"Sandstone Wall (344)",value:"SANDSTONE_WALL"},
		    {text:"End Stone Brick Wall (345)",value:"END_STONE_BRICK_WALL"},
		    {text:"Diorite Wall (346)",value:"DIORITE_WALL"},
		    {text:"Blackstone Wall (347)",value:"BLACKSTONE_WALL"},
		    {text:"Polished Blackstone Wall (348)",value:"POLISHED_BLACKSTONE_WALL"},
		    {text:"Polished Blackstone Brick Wall (349)",value:"POLISHED_BLACKSTONE_BRICK_WALL"},
		    {text:"Cobbled Deepslate Wall (350)",value:"COBBLED_DEEPSLATE_WALL"},
		    {text:"Polished Deepslate Wall (351)",value:"POLISHED_DEEPSLATE_WALL"},
		    {text:"Deepslate Brick Wall (352)",value:"DEEPSLATE_BRICK_WALL"},
		    {text:"Deepslate Tile Wall (353)",value:"DEEPSLATE_TILE_WALL"},
		    {text:"Anvil (354)",value:"ANVIL"},
		    {text:"Chipped Anvil (355)",value:"CHIPPED_ANVIL"},
		    {text:"Damaged Anvil (356)",value:"DAMAGED_ANVIL"},
		    {text:"Chiseled Quartz Block (357)",value:"CHISELED_QUARTZ_BLOCK"},
		    {text:"Block of Quartz (358)",value:"QUARTZ_BLOCK"},
		    {text:"Quartz Bricks (359)",value:"QUARTZ_BRICKS"},
		    {text:"Quartz Pillar (360)",value:"QUARTZ_PILLAR"},
		    {text:"Quartz Stairs (361)",value:"QUARTZ_STAIRS"},
		    {text:"White Terracotta (362)",value:"WHITE_TERRACOTTA"},
		    {text:"Orange Terracotta (363)",value:"ORANGE_TERRACOTTA"},
		    {text:"Magenta Terracotta (364)",value:"MAGENTA_TERRACOTTA"},
		    {text:"Light Blue Terracotta (365)",value:"LIGHT_BLUE_TERRACOTTA"},
		    {text:"Yellow Terracotta (366)",value:"YELLOW_TERRACOTTA"},
		    {text:"Lime Terracotta (367)",value:"LIME_TERRACOTTA"},
		    {text:"Pink Terracotta (368)",value:"PINK_TERRACOTTA"},
		    {text:"Gray Terracotta (369)",value:"GRAY_TERRACOTTA"},
		    {text:"Light Gray Terracotta (370)",value:"LIGHT_GRAY_TERRACOTTA"},
		    {text:"Cyan Terracotta (371)",value:"CYAN_TERRACOTTA"},
		    {text:"Purple Terracotta (372)",value:"PURPLE_TERRACOTTA"},
		    {text:"Blue Terracotta (373)",value:"BLUE_TERRACOTTA"},
		    {text:"Brown Terracotta (374)",value:"BROWN_TERRACOTTA"},
		    {text:"Green Terracotta (375)",value:"GREEN_TERRACOTTA"},
		    {text:"Red Terracotta (376)",value:"RED_TERRACOTTA"},
		    {text:"Black Terracotta (377)",value:"BLACK_TERRACOTTA"},
		    {text:"Hay Bale (378)",value:"HAY_BLOCK"},
		    {text:"White Carpet (379)",value:"WHITE_CARPET"},
		    {text:"Orange Carpet (380)",value:"ORANGE_CARPET"},
		    {text:"Magenta Carpet (381)",value:"MAGENTA_CARPET"},
		    {text:"Light Blue Carpet (382)",value:"LIGHT_BLUE_CARPET"},
		    {text:"Yellow Carpet (383)",value:"YELLOW_CARPET"},
		    {text:"Lime Carpet (384)",value:"LIME_CARPET"},
		    {text:"Pink Carpet (385)",value:"PINK_CARPET"},
		    {text:"Gray Carpet (386)",value:"GRAY_CARPET"},
		    {text:"Light Gray Carpet (387)",value:"LIGHT_GRAY_CARPET"},
		    {text:"Cyan Carpet (388)",value:"CYAN_CARPET"},
		    {text:"Purple Carpet (389)",value:"PURPLE_CARPET"},
		    {text:"Blue Carpet (390)",value:"BLUE_CARPET"},
		    {text:"Brown Carpet (391)",value:"BROWN_CARPET"},
		    {text:"Green Carpet (392)",value:"GREEN_CARPET"},
		    {text:"Red Carpet (393)",value:"RED_CARPET"},
		    {text:"Black Carpet (394)",value:"BLACK_CARPET"},
		    {text:"Terracotta (395)",value:"TERRACOTTA"},
		    {text:"Packed Ice (396)",value:"PACKED_ICE"},
		    {text:"Sunflower (397)",value:"SUNFLOWER"},
		    {text:"Lilac (398)",value:"LILAC"},
		    {text:"Rose Bush (399)",value:"ROSE_BUSH"},
		    {text:"Peony (400)",value:"PEONY"},
		    {text:"Tall Grass (401)",value:"TALL_GRASS"},
		    {text:"Large Fern (402)",value:"LARGE_FERN"},
		    {text:"White Stained Glass (403)",value:"WHITE_STAINED_GLASS"},
		    {text:"Orange Stained Glass (404)",value:"ORANGE_STAINED_GLASS"},
		    {text:"Magenta Stained Glass (405)",value:"MAGENTA_STAINED_GLASS"},
		    {text:"Light Blue Stained Glass (406)",value:"LIGHT_BLUE_STAINED_GLASS"},
		    {text:"Yellow Stained Glass (407)",value:"YELLOW_STAINED_GLASS"},
		    {text:"Lime Stained Glass (408)",value:"LIME_STAINED_GLASS"},
		    {text:"Pink Stained Glass (409)",value:"PINK_STAINED_GLASS"},
		    {text:"Gray Stained Glass (410)",value:"GRAY_STAINED_GLASS"},
		    {text:"Light Gray Stained Glass (411)",value:"LIGHT_GRAY_STAINED_GLASS"},
		    {text:"Cyan Stained Glass (412)",value:"CYAN_STAINED_GLASS"},
		    {text:"Purple Stained Glass (413)",value:"PURPLE_STAINED_GLASS"},
		    {text:"Blue Stained Glass (414)",value:"BLUE_STAINED_GLASS"},
		    {text:"Brown Stained Glass (415)",value:"BROWN_STAINED_GLASS"},
		    {text:"Green Stained Glass (416)",value:"GREEN_STAINED_GLASS"},
		    {text:"Red Stained Glass (417)",value:"RED_STAINED_GLASS"},
		    {text:"Black Stained Glass (418)",value:"BLACK_STAINED_GLASS"},
		    {text:"White Stained Glass Pane (419)",value:"WHITE_STAINED_GLASS_PANE"},
		    {text:"Orange Stained Glass Pane (420)",value:"ORANGE_STAINED_GLASS_PANE"},
		    {text:"Magenta Stained Glass Pane (421)",value:"MAGENTA_STAINED_GLASS_PANE"},
		    {text:"Light Blue Stained Glass Pane (422)",value:"LIGHT_BLUE_STAINED_GLASS_PANE"},
		    {text:"Yellow Stained Glass Pane (423)",value:"YELLOW_STAINED_GLASS_PANE"},
		    {text:"Lime Stained Glass Pane (424)",value:"LIME_STAINED_GLASS_PANE"},
		    {text:"Pink Stained Glass Pane (425)",value:"PINK_STAINED_GLASS_PANE"},
		    {text:"Gray Stained Glass Pane (426)",value:"GRAY_STAINED_GLASS_PANE"},
		    {text:"Light Gray Stained Glass Pane (427)",value:"LIGHT_GRAY_STAINED_GLASS_PANE"},
		    {text:"Cyan Stained Glass Pane (428)",value:"CYAN_STAINED_GLASS_PANE"},
		    {text:"Purple Stained Glass Pane (429)",value:"PURPLE_STAINED_GLASS_PANE"},
		    {text:"Blue Stained Glass Pane (430)",value:"BLUE_STAINED_GLASS_PANE"},
		    {text:"Brown Stained Glass Pane (431)",value:"BROWN_STAINED_GLASS_PANE"},
		    {text:"Green Stained Glass Pane (432)",value:"GREEN_STAINED_GLASS_PANE"},
		    {text:"Red Stained Glass Pane (433)",value:"RED_STAINED_GLASS_PANE"},
		    {text:"Black Stained Glass Pane (434)",value:"BLACK_STAINED_GLASS_PANE"},
		    {text:"Prismarine (435)",value:"PRISMARINE"},
		    {text:"Prismarine Bricks (436)",value:"PRISMARINE_BRICKS"},
		    {text:"Dark Prismarine (437)",value:"DARK_PRISMARINE"},
		    {text:"Prismarine Stairs (438)",value:"PRISMARINE_STAIRS"},
		    {text:"Prismarine Brick Stairs (439)",value:"PRISMARINE_BRICK_STAIRS"},
		    {text:"Dark Prismarine Stairs (440)",value:"DARK_PRISMARINE_STAIRS"},
		    {text:"Sea Lantern (441)",value:"SEA_LANTERN"},
		    {text:"Red Sandstone (442)",value:"RED_SANDSTONE"},
		    {text:"Chiseled Red Sandstone (443)",value:"CHISELED_RED_SANDSTONE"},
		    {text:"Cut Red Sandstone (444)",value:"CUT_RED_SANDSTONE"},
		    {text:"Red Sandstone Stairs (445)",value:"RED_SANDSTONE_STAIRS"},
		    {text:"Magma Block (446)",value:"MAGMA_BLOCK"},
		    {text:"Nether Wart Block (447)",value:"NETHER_WART_BLOCK"},
		    {text:"Warped Wart Block (448)",value:"WARPED_WART_BLOCK"},
		    {text:"Red Nether Bricks (449)",value:"RED_NETHER_BRICKS"},
		    {text:"Bone Block (450)",value:"BONE_BLOCK"},
		    {text:"Shulker Box (451)",value:"SHULKER_BOX"},
		    {text:"White Shulker Box (452)",value:"WHITE_SHULKER_BOX"},
		    {text:"Orange Shulker Box (453)",value:"ORANGE_SHULKER_BOX"},
		    {text:"Magenta Shulker Box (454)",value:"MAGENTA_SHULKER_BOX"},
		    {text:"Light Blue Shulker Box (455)",value:"LIGHT_BLUE_SHULKER_BOX"},
		    {text:"Yellow Shulker Box (456)",value:"YELLOW_SHULKER_BOX"},
		    {text:"Lime Shulker Box (457)",value:"LIME_SHULKER_BOX"},
		    {text:"Pink Shulker Box (458)",value:"PINK_SHULKER_BOX"},
		    {text:"Gray Shulker Box (459)",value:"GRAY_SHULKER_BOX"},
		    {text:"Light Gray Shulker Box (460)",value:"LIGHT_GRAY_SHULKER_BOX"},
		    {text:"Cyan Shulker Box (461)",value:"CYAN_SHULKER_BOX"},
		    {text:"Purple Shulker Box (462)",value:"PURPLE_SHULKER_BOX"},
		    {text:"Blue Shulker Box (463)",value:"BLUE_SHULKER_BOX"},
		    {text:"Brown Shulker Box (464)",value:"BROWN_SHULKER_BOX"},
		    {text:"Green Shulker Box (465)",value:"GREEN_SHULKER_BOX"},
		    {text:"Red Shulker Box (466)",value:"RED_SHULKER_BOX"},
		    {text:"Black Shulker Box (467)",value:"BLACK_SHULKER_BOX"},
		    {text:"White Glazed Terracotta (468)",value:"WHITE_GLAZED_TERRACOTTA"},
		    {text:"Orange Glazed Terracotta (469)",value:"ORANGE_GLAZED_TERRACOTTA"},
		    {text:"Magenta Glazed Terracotta (470)",value:"MAGENTA_GLAZED_TERRACOTTA"},
		    {text:"Light Blue Glazed Terracotta (471)",value:"LIGHT_BLUE_GLAZED_TERRACOTTA"},
		    {text:"Yellow Glazed Terracotta (472)",value:"YELLOW_GLAZED_TERRACOTTA"},
		    {text:"Lime Glazed Terracotta (473)",value:"LIME_GLAZED_TERRACOTTA"},
		    {text:"Pink Glazed Terracotta (474)",value:"PINK_GLAZED_TERRACOTTA"},
		    {text:"Gray Glazed Terracotta (475)",value:"GRAY_GLAZED_TERRACOTTA"},
		    {text:"Light Gray Glazed Terracotta (476)",value:"LIGHT_GRAY_GLAZED_TERRACOTTA"},
		    {text:"Cyan Glazed Terracotta (477)",value:"CYAN_GLAZED_TERRACOTTA"},
		    {text:"Purple Glazed Terracotta (478)",value:"PURPLE_GLAZED_TERRACOTTA"},
		    {text:"Blue Glazed Terracotta (479)",value:"BLUE_GLAZED_TERRACOTTA"},
		    {text:"Brown Glazed Terracotta (480)",value:"BROWN_GLAZED_TERRACOTTA"},
		    {text:"Green Glazed Terracotta (481)",value:"GREEN_GLAZED_TERRACOTTA"},
		    {text:"Red Glazed Terracotta (482)",value:"RED_GLAZED_TERRACOTTA"},
		    {text:"Black Glazed Terracotta (483)",value:"BLACK_GLAZED_TERRACOTTA"},
		    {text:"White Concrete (484)",value:"WHITE_CONCRETE"},
		    {text:"Orange Concrete (485)",value:"ORANGE_CONCRETE"},
		    {text:"Magenta Concrete (486)",value:"MAGENTA_CONCRETE"},
		    {text:"Light Blue Concrete (487)",value:"LIGHT_BLUE_CONCRETE"},
		    {text:"Yellow Concrete (488)",value:"YELLOW_CONCRETE"},
		    {text:"Lime Concrete (489)",value:"LIME_CONCRETE"},
		    {text:"Pink Concrete (490)",value:"PINK_CONCRETE"},
		    {text:"Gray Concrete (491)",value:"GRAY_CONCRETE"},
		    {text:"Light Gray Concrete (492)",value:"LIGHT_GRAY_CONCRETE"},
		    {text:"Cyan Concrete (493)",value:"CYAN_CONCRETE"},
		    {text:"Purple Concrete (494)",value:"PURPLE_CONCRETE"},
		    {text:"Blue Concrete (495)",value:"BLUE_CONCRETE"},
		    {text:"Brown Concrete (496)",value:"BROWN_CONCRETE"},
		    {text:"Green Concrete (497)",value:"GREEN_CONCRETE"},
		    {text:"Red Concrete (498)",value:"RED_CONCRETE"},
		    {text:"Black Concrete (499)",value:"BLACK_CONCRETE"},
		    {text:"White Concrete Powder (500)",value:"WHITE_CONCRETE_POWDER"},
		    {text:"Orange Concrete Powder (501)",value:"ORANGE_CONCRETE_POWDER"},
		    {text:"Magenta Concrete Powder (502)",value:"MAGENTA_CONCRETE_POWDER"},
		    {text:"Light Blue Concrete Powder (503)",value:"LIGHT_BLUE_CONCRETE_POWDER"},
		    {text:"Yellow Concrete Powder (504)",value:"YELLOW_CONCRETE_POWDER"},
		    {text:"Lime Concrete Powder (505)",value:"LIME_CONCRETE_POWDER"},
		    {text:"Pink Concrete Powder (506)",value:"PINK_CONCRETE_POWDER"},
		    {text:"Gray Concrete Powder (507)",value:"GRAY_CONCRETE_POWDER"},
		    {text:"Light Gray Concrete Powder (508)",value:"LIGHT_GRAY_CONCRETE_POWDER"},
		    {text:"Cyan Concrete Powder (509)",value:"CYAN_CONCRETE_POWDER"},
		    {text:"Purple Concrete Powder (510)",value:"PURPLE_CONCRETE_POWDER"},
		    {text:"Blue Concrete Powder (511)",value:"BLUE_CONCRETE_POWDER"},
		    {text:"Brown Concrete Powder (512)",value:"BROWN_CONCRETE_POWDER"},
		    {text:"Green Concrete Powder (513)",value:"GREEN_CONCRETE_POWDER"},
		    {text:"Red Concrete Powder (514)",value:"RED_CONCRETE_POWDER"},
		    {text:"Black Concrete Powder (515)",value:"BLACK_CONCRETE_POWDER"},
		    {text:"Turtle Egg (516)",value:"TURTLE_EGG"},
		    {text:"Dead Tube Coral Block (517)",value:"DEAD_TUBE_CORAL_BLOCK"},
		    {text:"Dead Brain Coral Block (518)",value:"DEAD_BRAIN_CORAL_BLOCK"},
		    {text:"Dead Bubble Coral Block (519)",value:"DEAD_BUBBLE_CORAL_BLOCK"},
		    {text:"Dead Fire Coral Block (520)",value:"DEAD_FIRE_CORAL_BLOCK"},
		    {text:"Dead Horn Coral Block (521)",value:"DEAD_HORN_CORAL_BLOCK"},
		    {text:"Tube Coral Block (522)",value:"TUBE_CORAL_BLOCK"},
		    {text:"Brain Coral Block (523)",value:"BRAIN_CORAL_BLOCK"},
		    {text:"Bubble Coral Block (524)",value:"BUBBLE_CORAL_BLOCK"},
		    {text:"Fire Coral Block (525)",value:"FIRE_CORAL_BLOCK"},
		    {text:"Horn Coral Block (526)",value:"HORN_CORAL_BLOCK"},
		    {text:"Tube Coral (527)",value:"TUBE_CORAL"},
		    {text:"Brain Coral (528)",value:"BRAIN_CORAL"},
		    {text:"Bubble Coral (529)",value:"BUBBLE_CORAL"},
		    {text:"Fire Coral (530)",value:"FIRE_CORAL"},
		    {text:"Horn Coral (531)",value:"HORN_CORAL"},
		    {text:"Dead Brain Coral (532)",value:"DEAD_BRAIN_CORAL"},
		    {text:"Dead Bubble Coral (533)",value:"DEAD_BUBBLE_CORAL"},
		    {text:"Dead Fire Coral (534)",value:"DEAD_FIRE_CORAL"},
		    {text:"Dead Horn Coral (535)",value:"DEAD_HORN_CORAL"},
		    {text:"Dead Tube Coral (536)",value:"DEAD_TUBE_CORAL"},
		    {text:"Tube Coral Fan (537)",value:"TUBE_CORAL_FAN"},
		    {text:"Brain Coral Fan (538)",value:"BRAIN_CORAL_FAN"},
		    {text:"Bubble Coral Fan (539)",value:"BUBBLE_CORAL_FAN"},
		    {text:"Fire Coral Fan (540)",value:"FIRE_CORAL_FAN"},
		    {text:"Horn Coral Fan (541)",value:"HORN_CORAL_FAN"},
		    {text:"Dead Tube Coral Fan (542)",value:"DEAD_TUBE_CORAL_FAN"},
		    {text:"Dead Brain Coral Fan (543)",value:"DEAD_BRAIN_CORAL_FAN"},
		    {text:"Dead Bubble Coral Fan (544)",value:"DEAD_BUBBLE_CORAL_FAN"},
		    {text:"Dead Fire Coral Fan (545)",value:"DEAD_FIRE_CORAL_FAN"},
		    {text:"Dead Horn Coral Fan (546)",value:"DEAD_HORN_CORAL_FAN"},
		    {text:"Blue Ice (547)",value:"BLUE_ICE"},
		    {text:"Conduit (548)",value:"CONDUIT"},
		    {text:"Polished Granite Stairs (549)",value:"POLISHED_GRANITE_STAIRS"},
		    {text:"Smooth Red Sandstone Stairs (550)",value:"SMOOTH_RED_SANDSTONE_STAIRS"},
		    {text:"Mossy Stone Brick Stairs (551)",value:"MOSSY_STONE_BRICK_STAIRS"},
		    {text:"Polished Diorite Stairs (552)",value:"POLISHED_DIORITE_STAIRS"},
		    {text:"Mossy Cobblestone Stairs (553)",value:"MOSSY_COBBLESTONE_STAIRS"},
		    {text:"End Stone Brick Stairs (554)",value:"END_STONE_BRICK_STAIRS"},
		    {text:"Stone Stairs (555)",value:"STONE_STAIRS"},
		    {text:"Smooth Sandstone Stairs (556)",value:"SMOOTH_SANDSTONE_STAIRS"},
		    {text:"Smooth Quartz Stairs (557)",value:"SMOOTH_QUARTZ_STAIRS"},
		    {text:"Granite Stairs (558)",value:"GRANITE_STAIRS"},
		    {text:"Andesite Stairs (559)",value:"ANDESITE_STAIRS"},
		    {text:"Red Nether Brick Stairs (560)",value:"RED_NETHER_BRICK_STAIRS"},
		    {text:"Polished Andesite Stairs (561)",value:"POLISHED_ANDESITE_STAIRS"},
		    {text:"Diorite Stairs (562)",value:"DIORITE_STAIRS"},
		    {text:"Cobbled Deepslate Stairs (563)",value:"COBBLED_DEEPSLATE_STAIRS"},
		    {text:"Polished Deepslate Stairs (564)",value:"POLISHED_DEEPSLATE_STAIRS"},
		    {text:"Deepslate Brick Stairs (565)",value:"DEEPSLATE_BRICK_STAIRS"},
		    {text:"Deepslate Tile Stairs (566)",value:"DEEPSLATE_TILE_STAIRS"},
		    {text:"Polished Granite Slab (567)",value:"POLISHED_GRANITE_SLAB"},
		    {text:"Smooth Red Sandstone Slab (568)",value:"SMOOTH_RED_SANDSTONE_SLAB"},
		    {text:"Mossy Stone Brick Slab (569)",value:"MOSSY_STONE_BRICK_SLAB"},
		    {text:"Polished Diorite Slab (570)",value:"POLISHED_DIORITE_SLAB"},
		    {text:"Mossy Cobblestone Slab (571)",value:"MOSSY_COBBLESTONE_SLAB"},
		    {text:"End Stone Brick Slab (572)",value:"END_STONE_BRICK_SLAB"},
		    {text:"Smooth Sandstone Slab (573)",value:"SMOOTH_SANDSTONE_SLAB"},
		    {text:"Smooth Quartz Slab (574)",value:"SMOOTH_QUARTZ_SLAB"},
		    {text:"Granite Slab (575)",value:"GRANITE_SLAB"},
		    {text:"Andesite Slab (576)",value:"ANDESITE_SLAB"},
		    {text:"Red Nether Brick Slab (577)",value:"RED_NETHER_BRICK_SLAB"},
		    {text:"Polished Andesite Slab (578)",value:"POLISHED_ANDESITE_SLAB"},
		    {text:"Diorite Slab (579)",value:"DIORITE_SLAB"},
		    {text:"Cobbled Deepslate Slab (580)",value:"COBBLED_DEEPSLATE_SLAB"},
		    {text:"Polished Deepslate Slab (581)",value:"POLISHED_DEEPSLATE_SLAB"},
		    {text:"Deepslate Brick Slab (582)",value:"DEEPSLATE_BRICK_SLAB"},
		    {text:"Deepslate Tile Slab (583)",value:"DEEPSLATE_TILE_SLAB"},
		    {text:"Scaffolding (584)",value:"SCAFFOLDING"},
		    {text:"Redstone Dust (585)",value:"REDSTONE"},
		    {text:"Redstone Torch (586)",value:"REDSTONE_TORCH"},
		    {text:"Block of Redstone (587)",value:"REDSTONE_BLOCK"},
		    {text:"Redstone Repeater (588)",value:"REPEATER"},
		    {text:"Redstone Comparator (589)",value:"COMPARATOR"},
		    {text:"Piston (590)",value:"PISTON"},
		    {text:"Sticky Piston (591)",value:"STICKY_PISTON"},
		    {text:"Slime Block (592)",value:"SLIME_BLOCK"},
		    {text:"Honey Block (593)",value:"HONEY_BLOCK"},
		    {text:"Observer (594)",value:"OBSERVER"},
		    {text:"Hopper (595)",value:"HOPPER"},
		    {text:"Dispenser (596)",value:"DISPENSER"},
		    {text:"Dropper (597)",value:"DROPPER"},
		    {text:"Lectern (598)",value:"LECTERN"},
		    {text:"Target (599)",value:"TARGET"},
		    {text:"Lever (600)",value:"LEVER"},
		    {text:"Lightning Rod (601)",value:"LIGHTNING_ROD"},
		    {text:"Daylight Detector (602)",value:"DAYLIGHT_DETECTOR"},
		    {text:"Sculk Sensor (603)",value:"SCULK_SENSOR"},
		    {text:"Tripwire Hook (604)",value:"TRIPWIRE_HOOK"},
		    {text:"Trapped Chest (605)",value:"TRAPPED_CHEST"},
		    {text:"TNT (606)",value:"TNT"},
		    {text:"Redstone Lamp (607)",value:"REDSTONE_LAMP"},
		    {text:"Note Block (608)",value:"NOTE_BLOCK"},
		    {text:"Stone Button (609)",value:"STONE_BUTTON"},
		    {text:"Polished Blackstone Button (610)",value:"POLISHED_BLACKSTONE_BUTTON"},
		    {text:"Oak Button (611)",value:"OAK_BUTTON"},
		    {text:"Spruce Button (612)",value:"SPRUCE_BUTTON"},
		    {text:"Birch Button (613)",value:"BIRCH_BUTTON"},
		    {text:"Jungle Button (614)",value:"JUNGLE_BUTTON"},
		    {text:"Acacia Button (615)",value:"ACACIA_BUTTON"},
		    {text:"Dark Oak Button (616)",value:"DARK_OAK_BUTTON"},
		    {text:"Mangrove Button (617)",value:"MANGROVE_BUTTON"},
		    {text:"Crimson Button (618)",value:"CRIMSON_BUTTON"},
		    {text:"Warped Button (619)",value:"WARPED_BUTTON"},
		    {text:"Stone Pressure Plate (620)",value:"STONE_PRESSURE_PLATE"},
		    {text:"Polished Blackstone Pressure Plate (621)",value:"POLISHED_BLACKSTONE_PRESSURE_PLATE"},
		    {text:"Light Weighted Pressure Plate (622)",value:"LIGHT_WEIGHTED_PRESSURE_PLATE"},
		    {text:"Heavy Weighted Pressure Plate (623)",value:"HEAVY_WEIGHTED_PRESSURE_PLATE"},
		    {text:"Oak Pressure Plate (624)",value:"OAK_PRESSURE_PLATE"},
		    {text:"Spruce Pressure Plate (625)",value:"SPRUCE_PRESSURE_PLATE"},
		    {text:"Birch Pressure Plate (626)",value:"BIRCH_PRESSURE_PLATE"},
		    {text:"Jungle Pressure Plate (627)",value:"JUNGLE_PRESSURE_PLATE"},
		    {text:"Acacia Pressure Plate (628)",value:"ACACIA_PRESSURE_PLATE"},
		    {text:"Dark Oak Pressure Plate (629)",value:"DARK_OAK_PRESSURE_PLATE"},
		    {text:"Mangrove Pressure Plate (630)",value:"MANGROVE_PRESSURE_PLATE"},
		    {text:"Crimson Pressure Plate (631)",value:"CRIMSON_PRESSURE_PLATE"},
		    {text:"Warped Pressure Plate (632)",value:"WARPED_PRESSURE_PLATE"},
		    {text:"Iron Door (633)",value:"IRON_DOOR"},
		    {text:"Oak Door (634)",value:"OAK_DOOR"},
		    {text:"Spruce Door (635)",value:"SPRUCE_DOOR"},
		    {text:"Birch Door (636)",value:"BIRCH_DOOR"},
		    {text:"Jungle Door (637)",value:"JUNGLE_DOOR"},
		    {text:"Acacia Door (638)",value:"ACACIA_DOOR"},
		    {text:"Dark Oak Door (639)",value:"DARK_OAK_DOOR"},
		    {text:"Mangrove Door (640)",value:"MANGROVE_DOOR"},
		    {text:"Crimson Door (641)",value:"CRIMSON_DOOR"},
		    {text:"Warped Door (642)",value:"WARPED_DOOR"},
		    {text:"Iron Trapdoor (643)",value:"IRON_TRAPDOOR"},
		    {text:"Oak Trapdoor (644)",value:"OAK_TRAPDOOR"},
		    {text:"Spruce Trapdoor (645)",value:"SPRUCE_TRAPDOOR"},
		    {text:"Birch Trapdoor (646)",value:"BIRCH_TRAPDOOR"},
		    {text:"Jungle Trapdoor (647)",value:"JUNGLE_TRAPDOOR"},
		    {text:"Acacia Trapdoor (648)",value:"ACACIA_TRAPDOOR"},
		    {text:"Dark Oak Trapdoor (649)",value:"DARK_OAK_TRAPDOOR"},
		    {text:"Mangrove Trapdoor (650)",value:"MANGROVE_TRAPDOOR"},
		    {text:"Crimson Trapdoor (651)",value:"CRIMSON_TRAPDOOR"},
		    {text:"Warped Trapdoor (652)",value:"WARPED_TRAPDOOR"},
		    {text:"Oak Fence Gate (653)",value:"OAK_FENCE_GATE"},
		    {text:"Spruce Fence Gate (654)",value:"SPRUCE_FENCE_GATE"},
		    {text:"Birch Fence Gate (655)",value:"BIRCH_FENCE_GATE"},
		    {text:"Jungle Fence Gate (656)",value:"JUNGLE_FENCE_GATE"},
		    {text:"Acacia Fence Gate (657)",value:"ACACIA_FENCE_GATE"},
		    {text:"Dark Oak Fence Gate (658)",value:"DARK_OAK_FENCE_GATE"},
		    {text:"Mangrove Fence Gate (659)",value:"MANGROVE_FENCE_GATE"},
		    {text:"Crimson Fence Gate (660)",value:"CRIMSON_FENCE_GATE"},
		    {text:"Warped Fence Gate (661)",value:"WARPED_FENCE_GATE"},
		    {text:"Powered Rail (662)",value:"POWERED_RAIL"},
		    {text:"Detector Rail (663)",value:"DETECTOR_RAIL"},
		    {text:"Rail (664)",value:"RAIL"},
		    {text:"Activator Rail (665)",value:"ACTIVATOR_RAIL"},
		    {text:"Saddle (666)",value:"SADDLE"},
		    {text:"Minecart (667)",value:"MINECART"},
		    {text:"Minecart with Chest (668)",value:"CHEST_MINECART"},
		    {text:"Minecart with Furnace (669)",value:"FURNACE_MINECART"},
		    {text:"Minecart with TNT (670)",value:"TNT_MINECART"},
		    {text:"Minecart with Hopper (671)",value:"HOPPER_MINECART"},
		    {text:"Carrot on a Stick (672)",value:"CARROT_ON_A_STICK"},
		    {text:"Warped Fungus on a Stick (673)",value:"WARPED_FUNGUS_ON_A_STICK"},
		    {text:"Elytra (674)",value:"ELYTRA"},
		    {text:"Oak Boat (675)",value:"OAK_BOAT"},
		    {text:"Oak Boat with Chest (676)",value:"OAK_CHEST_BOAT"},
		    {text:"Spruce Boat (677)",value:"SPRUCE_BOAT"},
		    {text:"Spruce Boat with Chest (678)",value:"SPRUCE_CHEST_BOAT"},
		    {text:"Birch Boat (679)",value:"BIRCH_BOAT"},
		    {text:"Birch Boat with Chest (680)",value:"BIRCH_CHEST_BOAT"},
		    {text:"Jungle Boat (681)",value:"JUNGLE_BOAT"},
		    {text:"Jungle Boat with Chest (682)",value:"JUNGLE_CHEST_BOAT"},
		    {text:"Acacia Boat (683)",value:"ACACIA_BOAT"},
		    {text:"Acacia Boat with Chest (684)",value:"ACACIA_CHEST_BOAT"},
		    {text:"Dark Oak Boat (685)",value:"DARK_OAK_BOAT"},
		    {text:"Dark Oak Boat with Chest (686)",value:"DARK_OAK_CHEST_BOAT"},
		    {text:"Mangrove Boat (687)",value:"MANGROVE_BOAT"},
		    {text:"Mangrove Boat with Chest (688)",value:"MANGROVE_CHEST_BOAT"},
		    {text:"Turtle Shell (689)",value:"TURTLE_HELMET"},
		    {text:"Scute (690)",value:"SCUTE"},
		    {text:"Flint and Steel (691)",value:"FLINT_AND_STEEL"},
		    {text:"Apple (692)",value:"APPLE"},
		    {text:"Bow (693)",value:"BOW"},
		    {text:"Arrow (694)",value:"ARROW"},
		    {text:"Coal (695)",value:"COAL"},
		    {text:"Charcoal (696)",value:"CHARCOAL"},
		    {text:"Diamond (697)",value:"DIAMOND"},
		    {text:"Emerald (698)",value:"EMERALD"},
		    {text:"Lapis Lazuli (699)",value:"LAPIS_LAZULI"},
		    {text:"Nether Quartz (700)",value:"QUARTZ"},
		    {text:"Amethyst Shard (701)",value:"AMETHYST_SHARD"},
		    {text:"Raw Iron (702)",value:"RAW_IRON"},
		    {text:"Iron Ingot (703)",value:"IRON_INGOT"},
		    {text:"Raw Copper (704)",value:"RAW_COPPER"},
		    {text:"Copper Ingot (705)",value:"COPPER_INGOT"},
		    {text:"Raw Gold (706)",value:"RAW_GOLD"},
		    {text:"Gold Ingot (707)",value:"GOLD_INGOT"},
		    {text:"Netherite Ingot (708)",value:"NETHERITE_INGOT"},
		    {text:"Netherite Scrap (709)",value:"NETHERITE_SCRAP"},
		    {text:"Wooden Sword (710)",value:"WOODEN_SWORD"},
		    {text:"Wooden Shovel (711)",value:"WOODEN_SHOVEL"},
		    {text:"Wooden Pickaxe (712)",value:"WOODEN_PICKAXE"},
		    {text:"Wooden Axe (713)",value:"WOODEN_AXE"},
		    {text:"Wooden Hoe (714)",value:"WOODEN_HOE"},
		    {text:"Stone Sword (715)",value:"STONE_SWORD"},
		    {text:"Stone Shovel (716)",value:"STONE_SHOVEL"},
		    {text:"Stone Pickaxe (717)",value:"STONE_PICKAXE"},
		    {text:"Stone Axe (718)",value:"STONE_AXE"},
		    {text:"Stone Hoe (719)",value:"STONE_HOE"},
		    {text:"Golden Sword (720)",value:"GOLDEN_SWORD"},
		    {text:"Golden Shovel (721)",value:"GOLDEN_SHOVEL"},
		    {text:"Golden Pickaxe (722)",value:"GOLDEN_PICKAXE"},
		    {text:"Golden Axe (723)",value:"GOLDEN_AXE"},
		    {text:"Golden Hoe (724)",value:"GOLDEN_HOE"},
		    {text:"Iron Sword (725)",value:"IRON_SWORD"},
		    {text:"Iron Shovel (726)",value:"IRON_SHOVEL"},
		    {text:"Iron Pickaxe (727)",value:"IRON_PICKAXE"},
		    {text:"Iron Axe (728)",value:"IRON_AXE"},
		    {text:"Iron Hoe (729)",value:"IRON_HOE"},
		    {text:"Diamond Sword (730)",value:"DIAMOND_SWORD"},
		    {text:"Diamond Shovel (731)",value:"DIAMOND_SHOVEL"},
		    {text:"Diamond Pickaxe (732)",value:"DIAMOND_PICKAXE"},
		    {text:"Diamond Axe (733)",value:"DIAMOND_AXE"},
		    {text:"Diamond Hoe (734)",value:"DIAMOND_HOE"},
		    {text:"Netherite Sword (735)",value:"NETHERITE_SWORD"},
		    {text:"Netherite Shovel (736)",value:"NETHERITE_SHOVEL"},
		    {text:"Netherite Pickaxe (737)",value:"NETHERITE_PICKAXE"},
		    {text:"Netherite Axe (738)",value:"NETHERITE_AXE"},
		    {text:"Netherite Hoe (739)",value:"NETHERITE_HOE"},
		    {text:"Stick (740)",value:"STICK"},
		    {text:"Bowl (741)",value:"BOWL"},
		    {text:"Mushroom Stew (742)",value:"MUSHROOM_STEW"},
		    {text:"String (743)",value:"STRING"},
		    {text:"Feather (744)",value:"FEATHER"},
		    {text:"Gunpowder (745)",value:"GUNPOWDER"},
		    {text:"Wheat Seeds (746)",value:"WHEAT_SEEDS"},
		    {text:"Wheat (747)",value:"WHEAT"},
		    {text:"Bread (748)",value:"BREAD"},
		    {text:"Leather Cap (749)",value:"LEATHER_HELMET"},
		    {text:"Leather Tunic (750)",value:"LEATHER_CHESTPLATE"},
		    {text:"Leather Pants (751)",value:"LEATHER_LEGGINGS"},
		    {text:"Leather Boots (752)",value:"LEATHER_BOOTS"},
		    {text:"Chainmail Helmet (753)",value:"CHAINMAIL_HELMET"},
		    {text:"Chainmail Chestplate (754)",value:"CHAINMAIL_CHESTPLATE"},
		    {text:"Chainmail Leggings (755)",value:"CHAINMAIL_LEGGINGS"},
		    {text:"Chainmail Boots (756)",value:"CHAINMAIL_BOOTS"},
		    {text:"Iron Helmet (757)",value:"IRON_HELMET"},
		    {text:"Iron Chestplate (758)",value:"IRON_CHESTPLATE"},
		    {text:"Iron Leggings (759)",value:"IRON_LEGGINGS"},
		    {text:"Iron Boots (760)",value:"IRON_BOOTS"},
		    {text:"Diamond Helmet (761)",value:"DIAMOND_HELMET"},
		    {text:"Diamond Chestplate (762)",value:"DIAMOND_CHESTPLATE"},
		    {text:"Diamond Leggings (763)",value:"DIAMOND_LEGGINGS"},
		    {text:"Diamond Boots (764)",value:"DIAMOND_BOOTS"},
		    {text:"Golden Helmet (765)",value:"GOLDEN_HELMET"},
		    {text:"Golden Chestplate (766)",value:"GOLDEN_CHESTPLATE"},
		    {text:"Golden Leggings (767)",value:"GOLDEN_LEGGINGS"},
		    {text:"Golden Boots (768)",value:"GOLDEN_BOOTS"},
		    {text:"Netherite Helmet (769)",value:"NETHERITE_HELMET"},
		    {text:"Netherite Chestplate (770)",value:"NETHERITE_CHESTPLATE"},
		    {text:"Netherite Leggings (771)",value:"NETHERITE_LEGGINGS"},
		    {text:"Netherite Boots (772)",value:"NETHERITE_BOOTS"},
		    {text:"Flint (773)",value:"FLINT"},
		    {text:"Raw Porkchop (774)",value:"PORKCHOP"},
		    {text:"Cooked Porkchop (775)",value:"COOKED_PORKCHOP"},
		    {text:"Painting (776)",value:"PAINTING"},
		    {text:"Golden Apple (777)",value:"GOLDEN_APPLE"},
		    {text:"Enchanted Golden Apple (778)",value:"ENCHANTED_GOLDEN_APPLE"},
		    {text:"Oak Sign (779)",value:"OAK_SIGN"},
		    {text:"Spruce Sign (780)",value:"SPRUCE_SIGN"},
		    {text:"Birch Sign (781)",value:"BIRCH_SIGN"},
		    {text:"Jungle Sign (782)",value:"JUNGLE_SIGN"},
		    {text:"Acacia Sign (783)",value:"ACACIA_SIGN"},
		    {text:"Dark Oak Sign (784)",value:"DARK_OAK_SIGN"},
		    {text:"Mangrove Sign (785)",value:"MANGROVE_SIGN"},
		    {text:"Crimson Sign (786)",value:"CRIMSON_SIGN"},
		    {text:"Warped Sign (787)",value:"WARPED_SIGN"},
		    {text:"Bucket (788)",value:"BUCKET"},
		    {text:"Water Bucket (789)",value:"WATER_BUCKET"},
		    {text:"Lava Bucket (790)",value:"LAVA_BUCKET"},
		    {text:"Powder Snow Bucket (791)",value:"POWDER_SNOW_BUCKET"},
		    {text:"Snowball (792)",value:"SNOWBALL"},
		    {text:"Leather (793)",value:"LEATHER"},
		    {text:"Milk Bucket (794)",value:"MILK_BUCKET"},
		    {text:"Bucket of Pufferfish (795)",value:"PUFFERFISH_BUCKET"},
		    {text:"Bucket of Salmon (796)",value:"SALMON_BUCKET"},
		    {text:"Bucket of Cod (797)",value:"COD_BUCKET"},
		    {text:"Bucket of Tropical Fish (798)",value:"TROPICAL_FISH_BUCKET"},
		    {text:"Bucket of Axolotl (799)",value:"AXOLOTL_BUCKET"},
		    {text:"Bucket of Tadpole (800)",value:"TADPOLE_BUCKET"},
		    {text:"Brick (801)",value:"BRICK"},
		    {text:"Clay Ball (802)",value:"CLAY_BALL"},
		    {text:"Dried Kelp Block (803)",value:"DRIED_KELP_BLOCK"},
		    {text:"Paper (804)",value:"PAPER"},
		    {text:"Book (805)",value:"BOOK"},
		    {text:"Slimeball (806)",value:"SLIME_BALL"},
		    {text:"Egg (807)",value:"EGG"},
		    {text:"Compass (808)",value:"COMPASS"},
		    {text:"Recovery Compass (809)",value:"RECOVERY_COMPASS"},
		    {text:"Fishing Rod (810)",value:"FISHING_ROD"},
		    {text:"Clock (811)",value:"CLOCK"},
		    {text:"Spyglass (812)",value:"SPYGLASS"},
		    {text:"Glowstone Dust (813)",value:"GLOWSTONE_DUST"},
		    {text:"Raw Cod (814)",value:"COD"},
		    {text:"Raw Salmon (815)",value:"SALMON"},
		    {text:"Tropical Fish (816)",value:"TROPICAL_FISH"},
		    {text:"Pufferfish (817)",value:"PUFFERFISH"},
		    {text:"Cooked Cod (818)",value:"COOKED_COD"},
		    {text:"Cooked Salmon (819)",value:"COOKED_SALMON"},
		    {text:"Ink Sac (820)",value:"INK_SAC"},
		    {text:"Glow Ink Sac (821)",value:"GLOW_INK_SAC"},
		    {text:"Cocoa Beans (822)",value:"COCOA_BEANS"},
		    {text:"White Dye (823)",value:"WHITE_DYE"},
		    {text:"Orange Dye (824)",value:"ORANGE_DYE"},
		    {text:"Magenta Dye (825)",value:"MAGENTA_DYE"},
		    {text:"Light Blue Dye (826)",value:"LIGHT_BLUE_DYE"},
		    {text:"Yellow Dye (827)",value:"YELLOW_DYE"},
		    {text:"Lime Dye (828)",value:"LIME_DYE"},
		    {text:"Pink Dye (829)",value:"PINK_DYE"},
		    {text:"Gray Dye (830)",value:"GRAY_DYE"},
		    {text:"Light Gray Dye (831)",value:"LIGHT_GRAY_DYE"},
		    {text:"Cyan Dye (832)",value:"CYAN_DYE"},
		    {text:"Purple Dye (833)",value:"PURPLE_DYE"},
		    {text:"Blue Dye (834)",value:"BLUE_DYE"},
		    {text:"Brown Dye (835)",value:"BROWN_DYE"},
		    {text:"Green Dye (836)",value:"GREEN_DYE"},
		    {text:"Red Dye (837)",value:"RED_DYE"},
		    {text:"Black Dye (838)",value:"BLACK_DYE"},
		    {text:"Bone Meal (839)",value:"BONE_MEAL"},
		    {text:"Bone (840)",value:"BONE"},
		    {text:"Sugar (841)",value:"SUGAR"},
		    {text:"Cake (842)",value:"CAKE"},
		    {text:"White Bed (843)",value:"WHITE_BED"},
		    {text:"Orange Bed (844)",value:"ORANGE_BED"},
		    {text:"Magenta Bed (845)",value:"MAGENTA_BED"},
		    {text:"Light Blue Bed (846)",value:"LIGHT_BLUE_BED"},
		    {text:"Yellow Bed (847)",value:"YELLOW_BED"},
		    {text:"Lime Bed (848)",value:"LIME_BED"},
		    {text:"Pink Bed (849)",value:"PINK_BED"},
		    {text:"Gray Bed (850)",value:"GRAY_BED"},
		    {text:"Light Gray Bed (851)",value:"LIGHT_GRAY_BED"},
		    {text:"Cyan Bed (852)",value:"CYAN_BED"},
		    {text:"Purple Bed (853)",value:"PURPLE_BED"},
		    {text:"Blue Bed (854)",value:"BLUE_BED"},
		    {text:"Brown Bed (855)",value:"BROWN_BED"},
		    {text:"Green Bed (856)",value:"GREEN_BED"},
		    {text:"Red Bed (857)",value:"RED_BED"},
		    {text:"Black Bed (858)",value:"BLACK_BED"},
		    {text:"Cookie (859)",value:"COOKIE"},
		    {text:"Map (860)",value:"FILLED_MAP"},
		    {text:"Shears (861)",value:"SHEARS"},
		    {text:"Melon Slice (862)",value:"MELON_SLICE"},
		    {text:"Dried Kelp (863)",value:"DRIED_KELP"},
		    {text:"Pumpkin Seeds (864)",value:"PUMPKIN_SEEDS"},
		    {text:"Melon Seeds (865)",value:"MELON_SEEDS"},
		    {text:"Raw Beef (866)",value:"BEEF"},
		    {text:"Steak (867)",value:"COOKED_BEEF"},
		    {text:"Raw Chicken (868)",value:"CHICKEN"},
		    {text:"Cooked Chicken (869)",value:"COOKED_CHICKEN"},
		    {text:"Rotten Flesh (870)",value:"ROTTEN_FLESH"},
		    {text:"Ender Pearl (871)",value:"ENDER_PEARL"},
		    {text:"Blaze Rod (872)",value:"BLAZE_ROD"},
		    {text:"Ghast Tear (873)",value:"GHAST_TEAR"},
		    {text:"Gold Nugget (874)",value:"GOLD_NUGGET"},
		    {text:"Nether Wart (875)",value:"NETHER_WART"},
		    {text:"Potion (876)",value:"POTION"},
		    {text:"Glass Bottle (877)",value:"GLASS_BOTTLE"},
		    {text:"Spider Eye (878)",value:"SPIDER_EYE"},
		    {text:"Fermented Spider Eye (879)",value:"FERMENTED_SPIDER_EYE"},
		    {text:"Blaze Powder (880)",value:"BLAZE_POWDER"},
		    {text:"Magma Cream (881)",value:"MAGMA_CREAM"},
		    {text:"Brewing Stand (882)",value:"BREWING_STAND"},
		    {text:"Cauldron (883)",value:"CAULDRON"},
		    {text:"Eye of Ender (884)",value:"ENDER_EYE"},
		    {text:"Glistering Melon Slice (885)",value:"GLISTERING_MELON_SLICE"},
		    {text:"Bottle o' Enchanting (886)",value:"EXPERIENCE_BOTTLE"},
		    {text:"Fire Charge (887)",value:"FIRE_CHARGE"},
		    {text:"Book and Quill (888)",value:"WRITABLE_BOOK"},
		    {text:"Written Book (889)",value:"WRITTEN_BOOK"},
		    {text:"Item Frame (890)",value:"ITEM_FRAME"},
		    {text:"Glow Item Frame (891)",value:"GLOW_ITEM_FRAME"},
		    {text:"Flower Pot (892)",value:"FLOWER_POT"},
		    {text:"Carrot (893)",value:"CARROT"},
		    {text:"Potato (894)",value:"POTATO"},
		    {text:"Baked Potato (895)",value:"BAKED_POTATO"},
		    {text:"Poisonous Potato (896)",value:"POISONOUS_POTATO"},
		    {text:"Empty Map (897)",value:"MAP"},
		    {text:"Golden Carrot (898)",value:"GOLDEN_CARROT"},
		    {text:"Skeleton Skull (899)",value:"SKELETON_SKULL"},
		    {text:"Wither Skeleton Skull (900)",value:"WITHER_SKELETON_SKULL"},
		    {text:"Zombie Head (901)",value:"ZOMBIE_HEAD"},
		    {text:"Creeper Head (902)",value:"CREEPER_HEAD"},
		    {text:"Dragon Head (903)",value:"DRAGON_HEAD"},
		    {text:"Nether Star (904)",value:"NETHER_STAR"},
		    {text:"Pumpkin Pie (905)",value:"PUMPKIN_PIE"},
		    {text:"Firework Rocket (906)",value:"FIREWORK_ROCKET"},
		    {text:"Firework Star (907)",value:"FIREWORK_STAR"},
		    {text:"Enchanted Book (908)",value:"ENCHANTED_BOOK"},
		    {text:"Nether Brick (909)",value:"NETHER_BRICK"},
		    {text:"Prismarine Shard (910)",value:"PRISMARINE_SHARD"},
		    {text:"Prismarine Crystals (911)",value:"PRISMARINE_CRYSTALS"},
		    {text:"Raw Rabbit (912)",value:"RABBIT"},
		    {text:"Cooked Rabbit (913)",value:"COOKED_RABBIT"},
		    {text:"Rabbit Stew (914)",value:"RABBIT_STEW"},
		    {text:"Rabbit's Foot (915)",value:"RABBIT_FOOT"},
		    {text:"Rabbit Hide (916)",value:"RABBIT_HIDE"},
		    {text:"Armor Stand (917)",value:"ARMOR_STAND"},
		    {text:"Iron Horse Armor (918)",value:"IRON_HORSE_ARMOR"},
		    {text:"Golden Horse Armor (919)",value:"GOLDEN_HORSE_ARMOR"},
		    {text:"Diamond Horse Armor (920)",value:"DIAMOND_HORSE_ARMOR"},
		    {text:"Leather Horse Armor (921)",value:"LEATHER_HORSE_ARMOR"},
		    {text:"Lead (922)",value:"LEAD"},
		    {text:"Name Tag (923)",value:"NAME_TAG"},
		    {text:"Raw Mutton (924)",value:"MUTTON"},
		    {text:"Cooked Mutton (925)",value:"COOKED_MUTTON"},
		    {text:"White Banner (926)",value:"WHITE_BANNER"},
		    {text:"Orange Banner (927)",value:"ORANGE_BANNER"},
		    {text:"Magenta Banner (928)",value:"MAGENTA_BANNER"},
		    {text:"Light Blue Banner (929)",value:"LIGHT_BLUE_BANNER"},
		    {text:"Yellow Banner (930)",value:"YELLOW_BANNER"},
		    {text:"Lime Banner (931)",value:"LIME_BANNER"},
		    {text:"Pink Banner (932)",value:"PINK_BANNER"},
		    {text:"Gray Banner (933)",value:"GRAY_BANNER"},
		    {text:"Light Gray Banner (934)",value:"LIGHT_GRAY_BANNER"},
		    {text:"Cyan Banner (935)",value:"CYAN_BANNER"},
		    {text:"Purple Banner (936)",value:"PURPLE_BANNER"},
		    {text:"Blue Banner (937)",value:"BLUE_BANNER"},
		    {text:"Brown Banner (938)",value:"BROWN_BANNER"},
		    {text:"Green Banner (939)",value:"GREEN_BANNER"},
		    {text:"Red Banner (940)",value:"RED_BANNER"},
		    {text:"Black Banner (941)",value:"BLACK_BANNER"},
		    {text:"End Crystal (942)",value:"END_CRYSTAL"},
		    {text:"Chorus Fruit (943)",value:"CHORUS_FRUIT"},
		    {text:"Popped Chorus Fruit (944)",value:"POPPED_CHORUS_FRUIT"},
		    {text:"Beetroot (945)",value:"BEETROOT"},
		    {text:"Beetroot Seeds (946)",value:"BEETROOT_SEEDS"},
		    {text:"Beetroot Soup (947)",value:"BEETROOT_SOUP"},
		    {text:"Dragon's Breath (948)",value:"DRAGON_BREATH"},
		    {text:"Splash Potion (949)",value:"SPLASH_POTION"},
		    {text:"Spectral Arrow (950)",value:"SPECTRAL_ARROW"},
		    {text:"Tipped Arrow (951)",value:"TIPPED_ARROW"},
		    {text:"Lingering Potion (952)",value:"LINGERING_POTION"},
		    {text:"Shield (953)",value:"SHIELD"},
		    {text:"Totem of Undying (954)",value:"TOTEM_OF_UNDYING"},
		    {text:"Shulker Shell (955)",value:"SHULKER_SHELL"},
		    {text:"Iron Nugget (956)",value:"IRON_NUGGET"},
		    {text:"Music Disc (957)",value:"MUSIC_DISC_13"},
		    {text:"Music Disc (958)",value:"MUSIC_DISC_CAT"},
		    {text:"Music Disc (959)",value:"MUSIC_DISC_BLOCKS"},
		    {text:"Music Disc (960)",value:"MUSIC_DISC_CHIRP"},
		    {text:"Music Disc (961)",value:"MUSIC_DISC_FAR"},
		    {text:"Music Disc (962)",value:"MUSIC_DISC_MALL"},
		    {text:"Music Disc (963)",value:"MUSIC_DISC_MELLOHI"},
		    {text:"Music Disc (964)",value:"MUSIC_DISC_STAL"},
		    {text:"Music Disc (965)",value:"MUSIC_DISC_STRAD"},
		    {text:"Music Disc (966)",value:"MUSIC_DISC_WARD"},
		    {text:"Music Disc (967)",value:"MUSIC_DISC_11"},
		    {text:"Music Disc (968)",value:"MUSIC_DISC_WAIT"},
		    {text:"Music Disc (969)",value:"MUSIC_DISC_OTHERSIDE"},
		    {text:"Music Disc (970)",value:"MUSIC_DISC_5"},
		    {text:"Music Disc (971)",value:"MUSIC_DISC_PIGSTEP"},
		    {text:"Disc Fragment (972)",value:"DISC_FRAGMENT_5"},
		    {text:"Trident (973)",value:"TRIDENT"},
		    {text:"Phantom Membrane (974)",value:"PHANTOM_MEMBRANE"},
		    {text:"Nautilus Shell (975)",value:"NAUTILUS_SHELL"},
		    {text:"Heart of the Sea (976)",value:"HEART_OF_THE_SEA"},
		    {text:"Crossbow (977)",value:"CROSSBOW"},
		    {text:"Suspicious Stew (978)",value:"SUSPICIOUS_STEW"},
		    {text:"Loom (979)",value:"LOOM"},
		    {text:"Banner Pattern (980)",value:"FLOWER_BANNER_PATTERN"},
		    {text:"Banner Pattern (981)",value:"CREEPER_BANNER_PATTERN"},
		    {text:"Banner Pattern (982)",value:"SKULL_BANNER_PATTERN"},
		    {text:"Banner Pattern (983)",value:"MOJANG_BANNER_PATTERN"},
		    {text:"Banner Pattern (984)",value:"GLOBE_BANNER_PATTERN"},
		    {text:"Banner Pattern (985)",value:"PIGLIN_BANNER_PATTERN"},
		    {text:"Goat Horn (986)",value:"GOAT_HORN"},
		    {text:"Composter (987)",value:"COMPOSTER"},
		    {text:"Barrel (988)",value:"BARREL"},
		    {text:"Smoker (989)",value:"SMOKER"},
		    {text:"Blast Furnace (990)",value:"BLAST_FURNACE"},
		    {text:"Cartography Table (991)",value:"CARTOGRAPHY_TABLE"},
		    {text:"Fletching Table (992)",value:"FLETCHING_TABLE"},
		    {text:"Grindstone (993)",value:"GRINDSTONE"},
		    {text:"Smithing Table (994)",value:"SMITHING_TABLE"},
		    {text:"Stonecutter (995)",value:"STONECUTTER"},
		    {text:"Bell (996)",value:"BELL"},
		    {text:"Lantern (997)",value:"LANTERN"},
		    {text:"Soul Lantern (998)",value:"SOUL_LANTERN"},
		    {text:"Sweet Berries (999)",value:"SWEET_BERRIES"},
		    {text:"Glow Berries (1000)",value:"GLOW_BERRIES"},
		    {text:"Campfire (1001)",value:"CAMPFIRE"},
		    {text:"Soul Campfire (1002)",value:"SOUL_CAMPFIRE"},
		    {text:"Shroomlight (1003)",value:"SHROOMLIGHT"},
		    {text:"Honeycomb (1004)",value:"HONEYCOMB"},
		    {text:"Bee Nest (1005)",value:"BEE_NEST"},
		    {text:"Beehive (1006)",value:"BEEHIVE"},
		    {text:"Honey Bottle (1007)",value:"HONEY_BOTTLE"},
		    {text:"Honeycomb Block (1008)",value:"HONEYCOMB_BLOCK"},
		    {text:"Lodestone (1009)",value:"LODESTONE"},
		    {text:"Crying Obsidian (1010)",value:"CRYING_OBSIDIAN"},
		    {text:"Blackstone (1011)",value:"BLACKSTONE"},
		    {text:"Blackstone Slab (1012)",value:"BLACKSTONE_SLAB"},
		    {text:"Blackstone Stairs (1013)",value:"BLACKSTONE_STAIRS"},
		    {text:"Gilded Blackstone (1014)",value:"GILDED_BLACKSTONE"},
		    {text:"Polished Blackstone (1015)",value:"POLISHED_BLACKSTONE"},
		    {text:"Polished Blackstone Slab (1016)",value:"POLISHED_BLACKSTONE_SLAB"},
		    {text:"Polished Blackstone Stairs (1017)",value:"POLISHED_BLACKSTONE_STAIRS"},
		    {text:"Chiseled Polished Blackstone (1018)",value:"CHISELED_POLISHED_BLACKSTONE"},
		    {text:"Polished Blackstone Bricks (1019)",value:"POLISHED_BLACKSTONE_BRICKS"},
		    {text:"Polished Blackstone Brick Slab (1020)",value:"POLISHED_BLACKSTONE_BRICK_SLAB"},
		    {text:"Polished Blackstone Brick Stairs (1021)",value:"POLISHED_BLACKSTONE_BRICK_STAIRS"},
		    {text:"Cracked Polished Blackstone Bricks (1022)",value:"CRACKED_POLISHED_BLACKSTONE_BRICKS"},
		    {text:"Respawn Anchor (1023)",value:"RESPAWN_ANCHOR"},
		    {text:"Candle (1024)",value:"CANDLE"},
		    {text:"White Candle (1025)",value:"WHITE_CANDLE"},
		    {text:"Orange Candle (1026)",value:"ORANGE_CANDLE"},
		    {text:"Magenta Candle (1027)",value:"MAGENTA_CANDLE"},
		    {text:"Light Blue Candle (1028)",value:"LIGHT_BLUE_CANDLE"},
		    {text:"Yellow Candle (1029)",value:"YELLOW_CANDLE"},
		    {text:"Lime Candle (1030)",value:"LIME_CANDLE"},
		    {text:"Pink Candle (1031)",value:"PINK_CANDLE"},
		    {text:"Gray Candle (1032)",value:"GRAY_CANDLE"},
		    {text:"Light Gray Candle (1033)",value:"LIGHT_GRAY_CANDLE"},
		    {text:"Cyan Candle (1034)",value:"CYAN_CANDLE"},
		    {text:"Purple Candle (1035)",value:"PURPLE_CANDLE"},
		    {text:"Blue Candle (1036)",value:"BLUE_CANDLE"},
		    {text:"Brown Candle (1037)",value:"BROWN_CANDLE"},
		    {text:"Green Candle (1038)",value:"GREEN_CANDLE"},
		    {text:"Red Candle (1039)",value:"RED_CANDLE"},
		    {text:"Black Candle (1040)",value:"BLACK_CANDLE"},
		    {text:"Small Amethyst Bud (1041)",value:"SMALL_AMETHYST_BUD"},
		    {text:"Medium Amethyst Bud (1042)",value:"MEDIUM_AMETHYST_BUD"},
		    {text:"Large Amethyst Bud (1043)",value:"LARGE_AMETHYST_BUD"},
		    {text:"Amethyst Cluster (1044)",value:"AMETHYST_CLUSTER"},
		    {text:"Pointed Dripstone (1045)",value:"POINTED_DRIPSTONE"},
		    {text:"Ochre Froglight (1046)",value:"OCHRE_FROGLIGHT"},
		    {text:"Verdant Froglight (1047)",value:"VERDANT_FROGLIGHT"},
		    {text:"Pearlescent Froglight (1048)",value:"PEARLESCENT_FROGLIGHT"},
		    {text:"Echo Shard (1049)",value:"ECHO_SHARD"},
		    {text:"Bedrock (1050)",value:"BEDROCK"},
		    {text:"Budding Amethyst (1051)",value:"BUDDING_AMETHYST"},
		    {text:"Petrified Oak Slab (1052)",value:"PETRIFIED_OAK_SLAB"},
		    {text:"Chorus Plant (1053)",value:"CHORUS_PLANT"},
		    {text:"Spawner (1054)",value:"SPAWNER"},
		    {text:"Farmland (1055)",value:"FARMLAND"},
		    {text:"Infested Stone (1056)",value:"INFESTED_STONE"},
		    {text:"Infested Cobblestone (1057)",value:"INFESTED_COBBLESTONE"},
		    {text:"Infested Stone Bricks (1058)",value:"INFESTED_STONE_BRICKS"},
		    {text:"Infested Mossy Stone Bricks (1059)",value:"INFESTED_MOSSY_STONE_BRICKS"},
		    {text:"Infested Cracked Stone Bricks (1060)",value:"INFESTED_CRACKED_STONE_BRICKS"},
		    {text:"Infested Chiseled Stone Bricks (1061)",value:"INFESTED_CHISELED_STONE_BRICKS"},
		    {text:"Infested Deepslate (1062)",value:"INFESTED_DEEPSLATE"},
		    {text:"Reinforced Deepslate (1063)",value:"REINFORCED_DEEPSLATE"},
		    {text:"End Portal Frame (1064)",value:"END_PORTAL_FRAME"},
		    {text:"Command Block (1065)",value:"COMMAND_BLOCK"},
		    {text:"Barrier (1066)",value:"BARRIER"},
		    {text:"Light (1067)",value:"LIGHT"},
		    {text:"Dirt Path (1068)",value:"DIRT_PATH"},
		    {text:"Repeating Command Block (1069)",value:"REPEATING_COMMAND_BLOCK"},
		    {text:"Chain Command Block (1070)",value:"CHAIN_COMMAND_BLOCK"},
		    {text:"Structure Void (1071)",value:"STRUCTURE_VOID"},
		    {text:"Structure Block (1072)",value:"STRUCTURE_BLOCK"},
		    {text:"Jigsaw Block (1073)",value:"JIGSAW"},
		    {text:"Bundle (1074)",value:"BUNDLE"},
		    {text:"Allay Spawn Egg (1075)",value:"ALLAY_SPAWN_EGG"},
		    {text:"Axolotl Spawn Egg (1076)",value:"AXOLOTL_SPAWN_EGG"},
		    {text:"Bat Spawn Egg (1077)",value:"BAT_SPAWN_EGG"},
		    {text:"Bee Spawn Egg (1078)",value:"BEE_SPAWN_EGG"},
		    {text:"Blaze Spawn Egg (1079)",value:"BLAZE_SPAWN_EGG"},
		    {text:"Cat Spawn Egg (1080)",value:"CAT_SPAWN_EGG"},
		    {text:"Cave Spider Spawn Egg (1081)",value:"CAVE_SPIDER_SPAWN_EGG"},
		    {text:"Chicken Spawn Egg (1082)",value:"CHICKEN_SPAWN_EGG"},
		    {text:"Cod Spawn Egg (1083)",value:"COD_SPAWN_EGG"},
		    {text:"Cow Spawn Egg (1084)",value:"COW_SPAWN_EGG"},
		    {text:"Creeper Spawn Egg (1085)",value:"CREEPER_SPAWN_EGG"},
		    {text:"Dolphin Spawn Egg (1086)",value:"DOLPHIN_SPAWN_EGG"},
		    {text:"Donkey Spawn Egg (1087)",value:"DONKEY_SPAWN_EGG"},
		    {text:"Drowned Spawn Egg (1088)",value:"DROWNED_SPAWN_EGG"},
		    {text:"Elder Guardian Spawn Egg (1089)",value:"ELDER_GUARDIAN_SPAWN_EGG"},
		    {text:"Enderman Spawn Egg (1090)",value:"ENDERMAN_SPAWN_EGG"},
		    {text:"Endermite Spawn Egg (1091)",value:"ENDERMITE_SPAWN_EGG"},
		    {text:"Evoker Spawn Egg (1092)",value:"EVOKER_SPAWN_EGG"},
		    {text:"Fox Spawn Egg (1093)",value:"FOX_SPAWN_EGG"},
		    {text:"Frog Spawn Egg (1094)",value:"FROG_SPAWN_EGG"},
		    {text:"Ghast Spawn Egg (1095)",value:"GHAST_SPAWN_EGG"},
		    {text:"Glow Squid Spawn Egg (1096)",value:"GLOW_SQUID_SPAWN_EGG"},
		    {text:"Goat Spawn Egg (1097)",value:"GOAT_SPAWN_EGG"},
		    {text:"Guardian Spawn Egg (1098)",value:"GUARDIAN_SPAWN_EGG"},
		    {text:"Hoglin Spawn Egg (1099)",value:"HOGLIN_SPAWN_EGG"},
		    {text:"Horse Spawn Egg (1100)",value:"HORSE_SPAWN_EGG"},
		    {text:"Husk Spawn Egg (1101)",value:"HUSK_SPAWN_EGG"},
		    {text:"Llama Spawn Egg (1102)",value:"LLAMA_SPAWN_EGG"},
		    {text:"Magma Cube Spawn Egg (1103)",value:"MAGMA_CUBE_SPAWN_EGG"},
		    {text:"Mooshroom Spawn Egg (1104)",value:"MOOSHROOM_SPAWN_EGG"},
		    {text:"Mule Spawn Egg (1105)",value:"MULE_SPAWN_EGG"},
		    {text:"Ocelot Spawn Egg (1106)",value:"OCELOT_SPAWN_EGG"},
		    {text:"Panda Spawn Egg (1107)",value:"PANDA_SPAWN_EGG"},
		    {text:"Parrot Spawn Egg (1108)",value:"PARROT_SPAWN_EGG"},
		    {text:"Phantom Spawn Egg (1109)",value:"PHANTOM_SPAWN_EGG"},
		    {text:"Pig Spawn Egg (1110)",value:"PIG_SPAWN_EGG"},
		    {text:"Piglin Spawn Egg (1111)",value:"PIGLIN_SPAWN_EGG"},
		    {text:"Piglin Brute Spawn Egg (1112)",value:"PIGLIN_BRUTE_SPAWN_EGG"},
		    {text:"Pillager Spawn Egg (1113)",value:"PILLAGER_SPAWN_EGG"},
		    {text:"Polar Bear Spawn Egg (1114)",value:"POLAR_BEAR_SPAWN_EGG"},
		    {text:"Pufferfish Spawn Egg (1115)",value:"PUFFERFISH_SPAWN_EGG"},
		    {text:"Rabbit Spawn Egg (1116)",value:"RABBIT_SPAWN_EGG"},
		    {text:"Ravager Spawn Egg (1117)",value:"RAVAGER_SPAWN_EGG"},
		    {text:"Salmon Spawn Egg (1118)",value:"SALMON_SPAWN_EGG"},
		    {text:"Sheep Spawn Egg (1119)",value:"SHEEP_SPAWN_EGG"},
		    {text:"Shulker Spawn Egg (1120)",value:"SHULKER_SPAWN_EGG"},
		    {text:"Silverfish Spawn Egg (1121)",value:"SILVERFISH_SPAWN_EGG"},
		    {text:"Skeleton Spawn Egg (1122)",value:"SKELETON_SPAWN_EGG"},
		    {text:"Skeleton Horse Spawn Egg (1123)",value:"SKELETON_HORSE_SPAWN_EGG"},
		    {text:"Slime Spawn Egg (1124)",value:"SLIME_SPAWN_EGG"},
		    {text:"Spider Spawn Egg (1125)",value:"SPIDER_SPAWN_EGG"},
		    {text:"Squid Spawn Egg (1126)",value:"SQUID_SPAWN_EGG"},
		    {text:"Stray Spawn Egg (1127)",value:"STRAY_SPAWN_EGG"},
		    {text:"Strider Spawn Egg (1128)",value:"STRIDER_SPAWN_EGG"},
		    {text:"Tadpole Spawn Egg (1129)",value:"TADPOLE_SPAWN_EGG"},
		    {text:"Trader Llama Spawn Egg (1130)",value:"TRADER_LLAMA_SPAWN_EGG"},
		    {text:"Tropical Fish Spawn Egg (1131)",value:"TROPICAL_FISH_SPAWN_EGG"},
		    {text:"Turtle Spawn Egg (1132)",value:"TURTLE_SPAWN_EGG"},
		    {text:"Vex Spawn Egg (1133)",value:"VEX_SPAWN_EGG"},
		    {text:"Villager Spawn Egg (1134)",value:"VILLAGER_SPAWN_EGG"},
		    {text:"Vindicator Spawn Egg (1135)",value:"VINDICATOR_SPAWN_EGG"},
		    {text:"Wandering Trader Spawn Egg (1136)",value:"WANDERING_TRADER_SPAWN_EGG"},
		    {text:"Warden Spawn Egg (1137)",value:"WARDEN_SPAWN_EGG"},
		    {text:"Witch Spawn Egg (1138)",value:"WITCH_SPAWN_EGG"},
		    {text:"Wither Skeleton Spawn Egg (1139)",value:"WITHER_SKELETON_SPAWN_EGG"},
		    {text:"Wolf Spawn Egg (1140)",value:"WOLF_SPAWN_EGG"},
		    {text:"Zoglin Spawn Egg (1141)",value:"ZOGLIN_SPAWN_EGG"},
		    {text:"Zombie Spawn Egg (1142)",value:"ZOMBIE_SPAWN_EGG"},
		    {text:"Zombie Horse Spawn Egg (1143)",value:"ZOMBIE_HORSE_SPAWN_EGG"},
		    {text:"Zombie Villager Spawn Egg (1144)",value:"ZOMBIE_VILLAGER_SPAWN_EGG"},
		    {text:"Zombified Piglin Spawn Egg (1145)",value:"ZOMBIFIED_PIGLIN_SPAWN_EGG"},
		    {text:"Player Head (1146)",value:"PLAYER_HEAD"},
		    {text:"Minecart with Command Block (1147)",value:"COMMAND_BLOCK_MINECART"},
		    {text:"Knowledge Book (1148)",value:"KNOWLEDGE_BOOK"},
		    {text:"Debug Stick (1149)",value:"DEBUG_STICK"},
		    {text:"Frogspawn (1150)",value:"FROGSPAWN"},
		]
            }
            }
        };
    };
    
    parseXYZ(x,y,z) {
        var coords = [];
        if (typeof(x)=="string" && x.indexOf(",") >= 0) {
            return x.split(",").map(parseFloat);
        }
        else {
            return [x,y,z].map(parseFloat);
        }
    }

    blockByName({name}){

	var parsed = parseInt(name);

	//window.alert(b0);

	if (isNaN(parsed)) {
	    // Block ID string
	    // for some reason the default values don't map. hack it manually
	    if (name == "Stone (0)") {
		name = "STONE";
	    }
	    if (name =="Redstone Wire") {
		name = "REDSTONE_WIRE";
	    }
	    var b = name;
	} else {
	    // index to blockMenu
	    var b = this.getInfo().menus.blockMenu.items[name].value;
	}
	return b;
    }
    
    send(msg) {
        if (!("TextEncoder" in window)) 
            alert("Sorry, this browser does not support TextEncoder...");
        var enc = new TextEncoder(); // always utf-8
        this.socket.send(enc.encode(msg+"\n"));
    };

    sendAndReceive(msg) {
        var rjm = this;
        return new Promise(function(resolve, reject) {            
            rjm.socket.onmessage = function(event) {
                resolve(event.data.text());
            };
            rjm.socket.onerror = function(err) {
                reject(err);
            };
//            rjm.socket.send(enc.encode(msg+"\n"));
              rjm.send(msg);
        });
    };
    
    resume() {
        if (this.savedBlocks != null) {
            for (var [key, value] of this.savedBlocks)
                this.send("world.setBlock("+key+","+value+")");
            this.savedBlocks = null;
        }
    };
    
    suspend() {
        if (this.savedBlocks == null) {
            this.savedBlocks = new Map();
        }
    }
    
    // b0 can either be in integer that is an index to the block menu
    // or a string that specifies the block ID
    // the block ID of the index may change as new blocks are added
    drawBlock(x,y,z,b0) {

	var parsed = parseInt(b0);

	//window.alert(b0);

	if (isNaN(parsed)) {
	    // Block ID string
	    // for some reason the default values don't map. hack it manually
	    if (b0 == "Stone (0)") {
		b0 = "STONE";
	    }
	    if (b0 =="Redstone Wire") {
		b0 = "REDSTONE_WIRE";
	    }
	    var b = b0;
	} else {
	    // index to blockMenu
	    var b = this.getInfo().menus.blockMenu.items[b0].value;
	}

        if (this.savedBlocks != null) {
            this.savedBlocks.set(""+x+","+y+","+z, b);
        }
        else {
            //this.socket.send("world.setBlock("+x+","+y+","+z+","+b+")");
            this.send("world.setBlock("+x+","+y+","+z+","+b+")");
        }
    };

    drawLine(x1,y1,z1,x2,y2,z2) {
        var l = this.getLine(x1,y1,z1,x2,y2,z2);
        
        for (var i=0; i<l.length ; i++) {
            this.drawBlock(l[i][0],l[i][1],l[i][2],this.turtle.block);
        }
    };
    
    turnTurtle({dir,n}) {
        if (dir=="right" || dir=="yaw") {
            this.turtle.matrix = this.turtle.mmMultiply(this.turtle.matrix, this.turtle.yawMatrix(n));    
        }
        else if (dir=="pitch") {
            this.turtle.matrix = this.turtle.mmMultiply(this.turtle.matrix, this.turtle.pitchMatrix(n));    
        }
        else { // if (dir=="roll") {
            this.turtle.matrix = this.turtle.mmMultiply(this.turtle.matrix, this.turtle.rollMatrix(n));    
        }
    };
    
    leftTurtle({n}) {
        this.turtle.matrix = this.turtle.mmMultiply(this.turtle.matrix, this.turtle.yawMatrix(-n));    
    }
    
    rightTurtle({n}) {
        this.turtle.matrix = this.turtle.mmMultiply(this.turtle.matrix, this.turtle.yawMatrix(n));
    }
    
    resetTurtleAngle({n}) {
        this.turtle.matrix = this.turtle.yawMatrix(n);
    };
    
    pen({state}) {
        this.turtle.penDown = state;
    }
    
    turtleBlock({b}) {
        this.turtle.block = b;
    }
    
    turtleBlockEasy({b}) {
        this.turtle.block = b;
    }
    
    setTurtlePosition({x,y,z}) {
        this.turtle.pos = this.parseXYZ(x,y,z);
    }
    
    turtleThickness({n}) {
        if (n==0) {
            this.turtle.nib = [];
        }
        else if (n==1) {
            this.turtle.nib = [[0,0,0]];
        }
        else if (n==2) {
            this.turtle.nib = [];
            for (var x=0; x<=1; x++) 
                for (var y=0; y<=1; y++) 
                    for (var z=0; z<=1; z++) 
                        this.turtle.nib.push([x,y,z]);
        }
        else {
            var r2 = n*n/4;
            var d = Math.ceil(n/2);
            this.turtle.nib = [];
            for (var x=-d; x<=d; x++) 
                for (var y=-d; y<=d; y++) 
                    for (var z=-d; z<=d; z++) 
                        if (x*x+y*y+z*z <= r2)
                            this.turtle.nib.push([x,y,z]);
        }
    }
    
    saveTurtle() {
        var t = this.turtle.clone();
        this.turtleHistory.push(t);
    }
    
    restoreTurtle() {
        if (this.turtleHistory.length > 0) {
            this.turtle = this.turtleHistory.pop();
        }
    }

    drawPoint(x0,y0,z0) {
        var l = this.turtle.nib.length;
        if (l == 0) {
            return;
        }
        else if (l == 1) {
            this.drawBlock(x0,y0,z0,this.turtle.block)
            return;
        }

        for (var i = 0 ; i < l ; i++) {
            var p = this.turtle.nib[i];
            var x = p[0] + x0;
            var y = p[1] + y0;
            var z = p[2] + z0;
            this.drawBlock(x,y,z,this.turtle.block)
        }
    };

    moveTurtle({dir,n}) {
        n *= dir;
        var newX = this.turtle.pos[0] + this.turtle.matrix[0][2] * n;
        var newY = this.turtle.pos[1] + this.turtle.matrix[1][2] * n;
        var newZ = this.turtle.pos[2] + this.turtle.matrix[2][2] * n;
        if (this.turtle.penDown != 0)
            this.drawLine(Math.round(this.turtle.pos[0]),Math.round(this.turtle.pos[1]),Math.round(this.turtle.pos[2]),Math.round(newX),Math.round(newY),Math.round(newZ));
        this.turtle.pos = [newX,newY,newZ];
    }; 
    
    getPosition() {
        return this.sendAndReceive("player.getPos()")
            .then(pos => {
                var p = pos.split(",");            
                return [parseFloat(p[0]),parseFloat(p[1]),parseFloat(p[2])];
            });
    };

    getPlayerIds() {
	return this.sendAndReceive("world.getPlayerIds()")
	    .then(players => {
		return players.split("|");
            });
    };

    spawnEntity({entity,x,y,z}) {
        var [x,y,z] = this.parseXYZ(x,y,z);
        return this.sendAndReceive("world.spawnEntity("+x+","+y+","+z+","+entity+")"); 
    };

    movePlayer({dx,dy,dz}) {
        var [x,y,z] = this.parseXYZ(dx,dy,dz);
        return this.getPosition().then(pos => this.setPlayerPos({x:pos[0]+x,y:pos[1]+y,z:pos[2]+z}));
    };

    movePlayerTop() {
        return this.getPosition().then(pos => 
            this.sendAndReceive("world.getHeight("+Math.floor(pos[0])+","+Math.floor(pos[2])+")").then(
                height => this.setPlayerPos({x:pos[0],y:height,z:pos[2]})));
    };

    getRotation() {
        return this.sendAndReceive("player.getRotation()")
            .then(r => {
                return parseFloat(r);
            });
    };
    
    getBlock({x,y,z}) {
        var pos = ""+this.parseXYZ(x,y,z).map(Math.floor);
        if (this.savedBlocks != null) {
            if (this.savedBlocks.has(pos)) {
                var b = this.savedBlocks.get(pos);
                if (b.indexOf(",")<0)
                    return ""+b+",0";
                else
                    return b;
            }
        }
//        return this.sendAndReceive("world.getBlockWithData("+pos+")")
        return this.sendAndReceive("world.getBlock("+pos+")")
            .then(b => {
                return b.trim();
            });
    };

    onBlock({b}) {
//        return this.getPosition().then( pos => this.sendAndReceive("world.getBlockWithData("+Math.floor(pos[0])+","+Math.floor(pos[1]-1)+","+Math.floor(pos[2])+")")
        return this.getPosition().then( pos => this.sendAndReceive("world.getBlock("+Math.floor(pos[0])+","+Math.floor(pos[1]-1)+","+Math.floor(pos[2])+")")
                    .then( block => block == b ) );
    }

    haveBlock({b,x,y,z}) {
        var [x,y,z] = this.parseXYZ(x,y,z).map(Math.floor);
//        return this.sendAndReceive("world.getBlockWithData("+x+","+y+","+z+")")
        return this.sendAndReceive("world.getBlock("+x+","+y+","+z+")")
            .then(block => {
                return block == b;
            });
    };
    
    getPlayerVector({mode}) {
        return this.getPosition()
            .then(pos => mode != 0 ? ""+pos[0]+","+pos[1]+","+pos[2] : ""+Math.floor(pos[0])+","+Math.floor(pos[1])+","+Math.floor(pos[2]));
    };
    
    makeVector({x,y,z}) {
        return ""+x+","+y+","+z
    }
    
    getHit() {
        if (this.hits.length>0) 
            return ""+this.hits.shift().slice(0,3);
        var rjm = this;
        return this.sendAndReceive("events.block.hits()")
            .then(result => {
                if (result.indexOf(",") < 0) 
                    return "";
                
                else {
                    var hits = result.split("|");
                    for(var i=0;i<hits.length;i++)
                        rjm.hits.push(hits[i].split(",").map(parseFloat));
                }
                return ""+this.shift.pop().slice(0,3);
            });
    };

    extractFromVector({vector,coordinate}) {
        var v = vector.split(",");
        if (v.length <= coordinate) {
            return 0.;
        }
        else {
            return parseFloat(v[coordinate]);
        }
    };

    getPlayerX({mode}) {
        return this.getPosition()
            .then(pos => mode != 0 ? pos[0] : Math.floor(pos[0]));
    };

    getPlayerY({mode}) {
        return this.getPosition()
            .then(pos => mode != 0 ? pos[1] : Math.floor(pos[1]));
    };

    getPlayerZ({mode}) {
        return this.getPosition()
            .then(pos => mode != 0 ? pos[2] : Math.floor(pos[2]));
    };

    getTurtleX({mode}) {
        return mode != 0 ? this.turtle.pos[0] : Math.floor(this.turtle.pos[0]);
    };

    getTurtleY({mode}) {
        return mode != 0 ? this.turtle.pos[1] : Math.floor(this.turtle.pos[1]);
    };

    getTurtleZ({mode}) {
        return mode != 0 ? this.turtle.pos[2] : Math.floor(this.turtle.pos[2]);
    };

    getTurtleVector({mode}) {
	var pos = this.turtle.pos;
        return mode != 0 ? ""+pos[0]+","+pos[1]+","+pos[2] : ""+Math.floor(pos[0])+","+Math.floor(pos[1])+","+Math.floor(pos[2]);
    };

    connect_p({ip,port}){
        this.ip = ip;
        this.port = port;

        var rjm = this;
        return new Promise(function(resolve, reject) {
            if (rjm.socket != null)
                rjm.socket.close();

            rjm.clear();
            rjm.socket = new WebSocket("ws://"+ip+":"+port);
            rjm.socket.onopen = function() {                
                resolve();
            };
            rjm.socket.onerror = function(err) {
                window.alert("Connection failed! Check server name and port. You may need to 'allow insecure content' on this page.")
                reject(err);
            };
        }).then(result => rjm.getPosition().then( result => {
            rjm.turtle.pos = result;
        })).then (result => rjm.getRotation().then( result => {
            rjm.playerRot = result;
            rjm.turtle.matrix = rjm.turtle.yawMatrix(Math.floor(0.5+result/90)*90);
	}));
    };
    
    chat({msg}){
        this.send("chat.post("+msg+")");
    };
    
    getLine(x1,y1,z1,x2,y2,z2) {
        var line = [];
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        z1 = Math.floor(z1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);
        z2 = Math.floor(z2);
        var point = [x1,y1,z1];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var dz = z2 - z1;
        var x_inc = dx < 0 ? -1 : 1;
        var l = Math.abs(dx);
        var y_inc = dy < 0 ? -1 : 1;
        var m = Math.abs(dy);
        var z_inc = dz < 0 ? -1 : 1;
        var n = Math.abs(dz);
        var dx2 = l * 2;
        var dy2 = m * 2;
        var dz2 = n * 2;
        
        var nib = this.turtle.nib;
        
        var draw = function(x,y,z) {
            for (var i=0; i<nib.length; i++) {
                var nx = x + nib[i][0];
                var ny = y + nib[i][1];
                var nz = z + nib[i][2];
                var j;
                for (j=0; j<line.length; j++) {
                    if (line[j][0] == nx && line[j][1] == ny && line[j][2] == nz)
                        break;
                }
                if (j<line.length)
                    continue;
                line.push([nx,ny,nz]);
            }
        };

        if (l >= m && l >= n) {
            var err_1 = dy2 - l;
            var err_2 = dz2 - l;
            for (var i=0; i<l; i++) {
                draw(point[0],point[1],point[2]);
                if (err_1 > 0) {
                    point[1] += y_inc;
                    err_1 -= dx2;
                }
                if (err_2 > 0) {
                    point[2] += z_inc;
                    err_2 -= dx2;
                }
                err_1 += dy2;
                err_2 += dz2;
                point[0] += x_inc;
            }
        }
        else if (m >= l && m >= n) {
            err_1 = dx2 - m;
            err_2 = dz2 - m;
            for (var i=0; i<m; i++) {
                draw(point[0],point[1],point[2]);
                if (err_1 > 0) {
                    point[0] += x_inc;
                    err_1 -= dy2;
                }
                if (err_2 > 0) {
                    point[2] += z_inc;
                    err_2 -= dy2;
                }
                err_1 += dx2;
                err_2 += dz2;
                point[1] += y_inc;
            }
        }
        else {
            err_1 = dy2 - n;
            err_2 = dx2 - n;
            for (var i=0; i < n; i++) {
                draw(point[0],point[1],point[2]);
                if (err_1 > 0) {
                    point[1] += y_inc;
                    err_1 -= dz2;
                }
                if (err_2 > 0) {
                    point[0] += x_inc;
                    err_2 -= dz2;
                }
                err_1 += dy2;
                err_2 += dx2;
                point[2] += z_inc;
            }
        }
        draw(point[0],point[1],point[2]);
        if (point[0] != x2 || point[1] != y2 || point[2] != z2) {
            draw(x2,y2,z2);
        }
        return line;
    };
    
    setBlock({x,y,z,b}) {
      var [x,y,z] = this.parseXYZ(x,y,z).map(Math.floor);
      this.drawBlock(x,y,z,b);
    };

    setPlayerPos({x,y,z}) {
      var [x,y,z] = this.parseXYZ(x,y,z);
      this.send("player.setPos("+x+","+y+","+z+")");
    };

    setPlayer({playerName}) {
	this.send("player.setPlayer("+playerName+")");
    };

}

(function() {
    var extensionClass = FruitJuice
    if (typeof window === "undefined" || !window.vm) {
        Scratch.extensions.register(new extensionClass())
    }
    else {
        var extensionInstance = new extensionClass(window.vm.extensionManager.runtime)
        var serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance)
        window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName)
    }
})()
