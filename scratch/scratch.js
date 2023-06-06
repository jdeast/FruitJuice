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

class RaspberryJamMod {
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
            "id": "RaspberryJamMod",
            "name": "Minecraft",
            
            "blocks": [{
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
                            "defaultValue": "stone",
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
                            "defaultValue": "stone",
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
                            "defaultValue": "stone",
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
                            "defaultValue": "stone",
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
                            "defaultValue": "redstone_wire",
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
                            "defaultValue": "15"
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
                            "defaultValue": "15"
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
                            "defaultValue": "15"
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
                            "defaultValue": "stone",
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
                            "defaultValue": "stone",
                        }
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
		    {text:"Stone",value:"stone"},
		    {text:"Redstone Wire",value:"redstone_wire"},
		    {text:"Redstone Torch",value:"redstone_torch"},
		    {text:"Redstone Repeater",value:"repeater"},
		    {text:"Redstone Comparator",value:"comparator"},
		    {text:"Piston",value:"piston"},
		    {text:"Lever",value:"lever"},
		    {text:"White Wool",value:"white_wool"},
		    {text:"Orange Wool",value:"orange_wool"},
		    {text:"Magenta Wool",value:"magenta_wool"},
		    {text:"Light Blue Wool",value:"light_blue_wool"},
		    {text:"Yellow Wool",value:"yellow_wool"},
		    {text:"Lime Wool",value:"lime_wool"},
		    {text:"Pink Wool",value:"pink_wool"},
		    {text:"Gray Wool",value:"gray_wool"},
		    {text:"Light Gray Wool",value:"light_gray_wool"},
		    {text:"Cyan Wool",value:"cyan_wool"},
		    {text:"Purple Wool",value:"purple_wool"},
		    {text:"Blue Wool",value:"blue_wool"},
		    {text:"Brown Wool",value:"brown_wool"},
		    {text:"Green Wool",value:"green_wool"},
		    {text:"Red Wool",value:"red_wool"},
		    {text:"Black Wool",value:"black_wool"},
	    ]
	    },
            blockMenu: { acceptReporters: true,
		items: [
		    {text:"Stone (0)",value:"stone"},
		    {text:"Granite (1)",value:"granite"},
		    {text:"Polished Granite (2)",value:"polished_granite"},
		    {text:"Diorite (3)",value:"diorite"},
		    {text:"Polished Diorite (4)",value:"polished_diorite"},
		    {text:"Andesite (5)",value:"andesite"},
		    {text:"Polished Andesite (6)",value:"polished_andesite"},
		    {text:"Deepslate (7)",value:"deepslate"},
		    {text:"Cobbled Deepslate (8)",value:"cobbled_deepslate"},
		    {text:"Polished Deepslate (9)",value:"polished_deepslate"},
		    {text:"Calcite (10)",value:"calcite"},
		    {text:"Tuff (11)",value:"tuff"},
		    {text:"Dripstone Block (12)",value:"dripstone_block"},
		    {text:"Grass Block (13)",value:"grass_block"},
		    {text:"Dirt (14)",value:"dirt"},
		    {text:"Coarse Dirt (15)",value:"coarse_dirt"},
		    {text:"Podzol (16)",value:"podzol"},
		    {text:"Rooted Dirt (17)",value:"rooted_dirt"},
		    {text:"Mud (18)",value:"mud"},
		    {text:"Crimson Nylium (19)",value:"crimson_nylium"},
		    {text:"Warped Nylium (20)",value:"warped_nylium"},
		    {text:"Cobblestone (21)",value:"cobblestone"},
		    {text:"Oak Planks (22)",value:"oak_planks"},
		    {text:"Spruce Planks (23)",value:"spruce_planks"},
		    {text:"Birch Planks (24)",value:"birch_planks"},
		    {text:"Jungle Planks (25)",value:"jungle_planks"},
		    {text:"Acacia Planks (26)",value:"acacia_planks"},
		    {text:"Dark Oak Planks (27)",value:"dark_oak_planks"},
		    {text:"Mangrove Planks (28)",value:"mangrove_planks"},
		    {text:"Crimson Planks (29)",value:"crimson_planks"},
		    {text:"Warped Planks (30)",value:"warped_planks"},
		    {text:"Oak Sapling (31)",value:"oak_sapling"},
		    {text:"Spruce Sapling (32)",value:"spruce_sapling"},
		    {text:"Birch Sapling (33)",value:"birch_sapling"},
		    {text:"Jungle Sapling (34)",value:"jungle_sapling"},
		    {text:"Acacia Sapling (35)",value:"acacia_sapling"},
		    {text:"Dark Oak Sapling (36)",value:"dark_oak_sapling"},
		    {text:"Mangrove Propagule (37)",value:"mangrove_propagule"},
		    {text:"Sand (38)",value:"sand"},
		    {text:"Red Sand (39)",value:"red_sand"},
		    {text:"Gravel (40)",value:"gravel"},
		    {text:"Coal Ore (41)",value:"coal_ore"},
		    {text:"Deepslate Coal Ore (42)",value:"deepslate_coal_ore"},
		    {text:"Iron Ore (43)",value:"iron_ore"},
		    {text:"Deepslate Iron Ore (44)",value:"deepslate_iron_ore"},
		    {text:"Copper Ore (45)",value:"copper_ore"},
		    {text:"Deepslate Copper Ore (46)",value:"deepslate_copper_ore"},
		    {text:"Gold Ore (47)",value:"gold_ore"},
		    {text:"Deepslate Gold Ore (48)",value:"deepslate_gold_ore"},
		    {text:"Redstone Ore (49)",value:"redstone_ore"},
		    {text:"Deepslate Redstone Ore (50)",value:"deepslate_redstone_ore"},
		    {text:"Emerald Ore (51)",value:"emerald_ore"},
		    {text:"Deepslate Emerald Ore (52)",value:"deepslate_emerald_ore"},
		    {text:"Lapis Lazuli Ore (53)",value:"lapis_ore"},
		    {text:"Deepslate Lapis Lazuli Ore (54)",value:"deepslate_lapis_ore"},
		    {text:"Diamond Ore (55)",value:"diamond_ore"},
		    {text:"Deepslate Diamond Ore (56)",value:"deepslate_diamond_ore"},
		    {text:"Nether Gold Ore (57)",value:"nether_gold_ore"},
		    {text:"Nether Quartz Ore (58)",value:"nether_quartz_ore"},
		    {text:"Ancient Debris (59)",value:"ancient_debris"},
		    {text:"Block of Coal (60)",value:"coal_block"},
		    {text:"Block of Raw Iron (61)",value:"raw_iron_block"},
		    {text:"Block of Raw Copper (62)",value:"raw_copper_block"},
		    {text:"Block of Raw Gold (63)",value:"raw_gold_block"},
		    {text:"Block of Amethyst (64)",value:"amethyst_block"},
		    {text:"Block of Iron (65)",value:"iron_block"},
		    {text:"Block of Copper (66)",value:"copper_block"},
		    {text:"Block of Gold (67)",value:"gold_block"},
		    {text:"Block of Diamond (68)",value:"diamond_block"},
		    {text:"Block of Netherite (69)",value:"netherite_block"},
		    {text:"Exposed Copper (70)",value:"exposed_copper"},
		    {text:"Weathered Copper (71)",value:"weathered_copper"},
		    {text:"Oxidized Copper (72)",value:"oxidized_copper"},
		    {text:"Cut Copper (73)",value:"cut_copper"},
		    {text:"Exposed Cut Copper (74)",value:"exposed_cut_copper"},
		    {text:"Weathered Cut Copper (75)",value:"weathered_cut_copper"},
		    {text:"Oxidized Cut Copper (76)",value:"oxidized_cut_copper"},
		    {text:"Cut Copper Stairs (77)",value:"cut_copper_stairs"},
		    {text:"Exposed Cut Copper Stairs (78)",value:"exposed_cut_copper_stairs"},
		    {text:"Weathered Cut Copper Stairs (79)",value:"weathered_cut_copper_stairs"},
		    {text:"Oxidized Cut Copper Stairs (80)",value:"oxidized_cut_copper_stairs"},
		    {text:"Cut Copper Slab (81)",value:"cut_copper_slab"},
		    {text:"Exposed Cut Copper Slab (82)",value:"exposed_cut_copper_slab"},
		    {text:"Weathered Cut Copper Slab (83)",value:"weathered_cut_copper_slab"},
		    {text:"Oxidized Cut Copper Slab (84)",value:"oxidized_cut_copper_slab"},
		    {text:"Waxed Block of Copper (85)",value:"waxed_copper_block"},
		    {text:"Waxed Exposed Copper (86)",value:"waxed_exposed_copper"},
		    {text:"Waxed Weathered Copper (87)",value:"waxed_weathered_copper"},
		    {text:"Waxed Oxidized Copper (88)",value:"waxed_oxidized_copper"},
		    {text:"Waxed Cut Copper (89)",value:"waxed_cut_copper"},
		    {text:"Waxed Exposed Cut Copper (90)",value:"waxed_exposed_cut_copper"},
		    {text:"Waxed Weathered Cut Copper (91)",value:"waxed_weathered_cut_copper"},
		    {text:"Waxed Oxidized Cut Copper (92)",value:"waxed_oxidized_cut_copper"},
		    {text:"Waxed Cut Copper Stairs (93)",value:"waxed_cut_copper_stairs"},
		    {text:"Waxed Exposed Cut Copper Stairs (94)",value:"waxed_exposed_cut_copper_stairs"},
		    {text:"Waxed Weathered Cut Copper Stairs (95)",value:"waxed_weathered_cut_copper_stairs"},
		    {text:"Waxed Oxidized Cut Copper Stairs (96)",value:"waxed_oxidized_cut_copper_stairs"},
		    {text:"Waxed Cut Copper Slab (97)",value:"waxed_cut_copper_slab"},
		    {text:"Waxed Exposed Cut Copper Slab (98)",value:"waxed_exposed_cut_copper_slab"},
		    {text:"Waxed Weathered Cut Copper Slab (99)",value:"waxed_weathered_cut_copper_slab"},
		    {text:"Waxed Oxidized Cut Copper Slab (100)",value:"waxed_oxidized_cut_copper_slab"},
		    {text:"Oak Log (101)",value:"oak_log"},
		    {text:"Spruce Log (102)",value:"spruce_log"},
		    {text:"Birch Log (103)",value:"birch_log"},
		    {text:"Jungle Log (104)",value:"jungle_log"},
		    {text:"Acacia Log (105)",value:"acacia_log"},
		    {text:"Dark Oak Log (106)",value:"dark_oak_log"},
		    {text:"Mangrove Log (107)",value:"mangrove_log"},
		    {text:"Mangrove Roots (108)",value:"mangrove_roots"},
		    {text:"Muddy Mangrove Roots (109)",value:"muddy_mangrove_roots"},
		    {text:"Crimson Stem (110)",value:"crimson_stem"},
		    {text:"Warped Stem (111)",value:"warped_stem"},
		    {text:"Stripped Oak Log (112)",value:"stripped_oak_log"},
		    {text:"Stripped Spruce Log (113)",value:"stripped_spruce_log"},
		    {text:"Stripped Birch Log (114)",value:"stripped_birch_log"},
		    {text:"Stripped Jungle Log (115)",value:"stripped_jungle_log"},
		    {text:"Stripped Acacia Log (116)",value:"stripped_acacia_log"},
		    {text:"Stripped Dark Oak Log (117)",value:"stripped_dark_oak_log"},
		    {text:"Stripped Mangrove Log (118)",value:"stripped_mangrove_log"},
		    {text:"Stripped Crimson Stem (119)",value:"stripped_crimson_stem"},
		    {text:"Stripped Warped Stem (120)",value:"stripped_warped_stem"},
		    {text:"Stripped Oak Wood (121)",value:"stripped_oak_wood"},
		    {text:"Stripped Spruce Wood (122)",value:"stripped_spruce_wood"},
		    {text:"Stripped Birch Wood (123)",value:"stripped_birch_wood"},
		    {text:"Stripped Jungle Wood (124)",value:"stripped_jungle_wood"},
		    {text:"Stripped Acacia Wood (125)",value:"stripped_acacia_wood"},
		    {text:"Stripped Dark Oak Wood (126)",value:"stripped_dark_oak_wood"},
		    {text:"Stripped Mangrove Wood (127)",value:"stripped_mangrove_wood"},
		    {text:"Stripped Crimson Hyphae (128)",value:"stripped_crimson_hyphae"},
		    {text:"Stripped Warped Hyphae (129)",value:"stripped_warped_hyphae"},
		    {text:"Oak Wood (130)",value:"oak_wood"},
		    {text:"Spruce Wood (131)",value:"spruce_wood"},
		    {text:"Birch Wood (132)",value:"birch_wood"},
		    {text:"Jungle Wood (133)",value:"jungle_wood"},
		    {text:"Acacia Wood (134)",value:"acacia_wood"},
		    {text:"Dark Oak Wood (135)",value:"dark_oak_wood"},
		    {text:"Mangrove Wood (136)",value:"mangrove_wood"},
		    {text:"Crimson Hyphae (137)",value:"crimson_hyphae"},
		    {text:"Warped Hyphae (138)",value:"warped_hyphae"},
		    {text:"Oak Leaves (139)",value:"oak_leaves"},
		    {text:"Spruce Leaves (140)",value:"spruce_leaves"},
		    {text:"Birch Leaves (141)",value:"birch_leaves"},
		    {text:"Jungle Leaves (142)",value:"jungle_leaves"},
		    {text:"Acacia Leaves (143)",value:"acacia_leaves"},
		    {text:"Dark Oak Leaves (144)",value:"dark_oak_leaves"},
		    {text:"Mangrove Leaves (145)",value:"mangrove_leaves"},
		    {text:"Azalea Leaves (146)",value:"azalea_leaves"},
		    {text:"Flowering Azalea Leaves (147)",value:"flowering_azalea_leaves"},
		    {text:"Sponge (148)",value:"sponge"},
		    {text:"Wet Sponge (149)",value:"wet_sponge"},
		    {text:"Glass (150)",value:"glass"},
		    {text:"Tinted Glass (151)",value:"tinted_glass"},
		    {text:"Block of Lapis Lazuli (152)",value:"lapis_block"},
		    {text:"Sandstone (153)",value:"sandstone"},
		    {text:"Chiseled Sandstone (154)",value:"chiseled_sandstone"},
		    {text:"Cut Sandstone (155)",value:"cut_sandstone"},
		    {text:"Cobweb (156)",value:"cobweb"},
		    {text:"Grass (157)",value:"grass"},
		    {text:"Fern (158)",value:"fern"},
		    {text:"Azalea (159)",value:"azalea"},
		    {text:"Flowering Azalea (160)",value:"flowering_azalea"},
		    {text:"Dead Bush (161)",value:"dead_bush"},
		    {text:"Seagrass (162)",value:"seagrass"},
		    {text:"Sea Pickle (163)",value:"sea_pickle"},
		    {text:"White Wool (164)",value:"white_wool"},
		    {text:"Orange Wool (165)",value:"orange_wool"},
		    {text:"Magenta Wool (166)",value:"magenta_wool"},
		    {text:"Light Blue Wool (167)",value:"light_blue_wool"},
		    {text:"Yellow Wool (168)",value:"yellow_wool"},
		    {text:"Lime Wool (169)",value:"lime_wool"},
		    {text:"Pink Wool (170)",value:"pink_wool"},
		    {text:"Gray Wool (171)",value:"gray_wool"},
		    {text:"Light Gray Wool (172)",value:"light_gray_wool"},
		    {text:"Cyan Wool (173)",value:"cyan_wool"},
		    {text:"Purple Wool (174)",value:"purple_wool"},
		    {text:"Blue Wool (175)",value:"blue_wool"},
		    {text:"Brown Wool (176)",value:"brown_wool"},
		    {text:"Green Wool (177)",value:"green_wool"},
		    {text:"Red Wool (178)",value:"red_wool"},
		    {text:"Black Wool (179)",value:"black_wool"},
		    {text:"Dandelion (180)",value:"dandelion"},
		    {text:"Poppy (181)",value:"poppy"},
		    {text:"Blue Orchid (182)",value:"blue_orchid"},
		    {text:"Allium (183)",value:"allium"},
		    {text:"Azure Bluet (184)",value:"azure_bluet"},
		    {text:"Red Tulip (185)",value:"red_tulip"},
		    {text:"Orange Tulip (186)",value:"orange_tulip"},
		    {text:"White Tulip (187)",value:"white_tulip"},
		    {text:"Pink Tulip (188)",value:"pink_tulip"},
		    {text:"Oxeye Daisy (189)",value:"oxeye_daisy"},
		    {text:"Cornflower (190)",value:"cornflower"},
		    {text:"Lily of the Valley (191)",value:"lily_of_the_valley"},
		    {text:"Wither Rose (192)",value:"wither_rose"},
		    {text:"Spore Blossom (193)",value:"spore_blossom"},
		    {text:"Brown Mushroom (194)",value:"brown_mushroom"},
		    {text:"Red Mushroom (195)",value:"red_mushroom"},
		    {text:"Crimson Fungus (196)",value:"crimson_fungus"},
		    {text:"Warped Fungus (197)",value:"warped_fungus"},
		    {text:"Crimson Roots (198)",value:"crimson_roots"},
		    {text:"Warped Roots (199)",value:"warped_roots"},
		    {text:"Nether Sprouts (200)",value:"nether_sprouts"},
		    {text:"Weeping Vines (201)",value:"weeping_vines"},
		    {text:"Twisting Vines (202)",value:"twisting_vines"},
		    {text:"Sugar Cane (203)",value:"sugar_cane"},
		    {text:"Kelp (204)",value:"kelp"},
		    {text:"Moss Carpet (205)",value:"moss_carpet"},
		    {text:"Moss Block (206)",value:"moss_block"},
		    {text:"Hanging Roots (207)",value:"hanging_roots"},
		    {text:"Big Dripleaf (208)",value:"big_dripleaf"},
		    {text:"Small Dripleaf (209)",value:"small_dripleaf"},
		    {text:"Bamboo (210)",value:"bamboo"},
		    {text:"Oak Slab (211)",value:"oak_slab"},
		    {text:"Spruce Slab (212)",value:"spruce_slab"},
		    {text:"Birch Slab (213)",value:"birch_slab"},
		    {text:"Jungle Slab (214)",value:"jungle_slab"},
		    {text:"Acacia Slab (215)",value:"acacia_slab"},
		    {text:"Dark Oak Slab (216)",value:"dark_oak_slab"},
		    {text:"Mangrove Slab (217)",value:"mangrove_slab"},
		    {text:"Crimson Slab (218)",value:"crimson_slab"},
		    {text:"Warped Slab (219)",value:"warped_slab"},
		    {text:"Stone Slab (220)",value:"stone_slab"},
		    {text:"Smooth Stone Slab (221)",value:"smooth_stone_slab"},
		    {text:"Sandstone Slab (222)",value:"sandstone_slab"},
		    {text:"Cut Sandstone Slab (223)",value:"cut_sandstone_slab"},
		    {text:"Cobblestone Slab (224)",value:"cobblestone_slab"},
		    {text:"Brick Slab (225)",value:"brick_slab"},
		    {text:"Stone Brick Slab (226)",value:"stone_brick_slab"},
		    {text:"Mud Brick Slab (227)",value:"mud_brick_slab"},
		    {text:"Nether Brick Slab (228)",value:"nether_brick_slab"},
		    {text:"Quartz Slab (229)",value:"quartz_slab"},
		    {text:"Red Sandstone Slab (230)",value:"red_sandstone_slab"},
		    {text:"Cut Red Sandstone Slab (231)",value:"cut_red_sandstone_slab"},
		    {text:"Purpur Slab (232)",value:"purpur_slab"},
		    {text:"Prismarine Slab (233)",value:"prismarine_slab"},
		    {text:"Prismarine Brick Slab (234)",value:"prismarine_brick_slab"},
		    {text:"Dark Prismarine Slab (235)",value:"dark_prismarine_slab"},
		    {text:"Smooth Quartz Block (236)",value:"smooth_quartz"},
		    {text:"Smooth Red Sandstone (237)",value:"smooth_red_sandstone"},
		    {text:"Smooth Sandstone (238)",value:"smooth_sandstone"},
		    {text:"Smooth Stone (239)",value:"smooth_stone"},
		    {text:"Bricks (240)",value:"bricks"},
		    {text:"Bookshelf (241)",value:"bookshelf"},
		    {text:"Mossy Cobblestone (242)",value:"mossy_cobblestone"},
		    {text:"Obsidian (243)",value:"obsidian"},
		    {text:"Torch (244)",value:"torch"},
		    {text:"End Rod (245)",value:"end_rod"},
		    {text:"Chorus Flower (246)",value:"chorus_flower"},
		    {text:"Purpur Block (247)",value:"purpur_block"},
		    {text:"Purpur Pillar (248)",value:"purpur_pillar"},
		    {text:"Purpur Stairs (249)",value:"purpur_stairs"},
		    {text:"Chest (250)",value:"chest"},
		    {text:"Crafting Table (251)",value:"crafting_table"},
		    {text:"Furnace (252)",value:"furnace"},
		    {text:"Ladder (253)",value:"ladder"},
		    {text:"Cobblestone Stairs (254)",value:"cobblestone_stairs"},
		    {text:"Snow (255)",value:"snow"},
		    {text:"Ice (256)",value:"ice"},
		    {text:"Snow Block (257)",value:"snow_block"},
		    {text:"Cactus (258)",value:"cactus"},
		    {text:"Clay (259)",value:"clay"},
		    {text:"Jukebox (260)",value:"jukebox"},
		    {text:"Oak Fence (261)",value:"oak_fence"},
		    {text:"Spruce Fence (262)",value:"spruce_fence"},
		    {text:"Birch Fence (263)",value:"birch_fence"},
		    {text:"Jungle Fence (264)",value:"jungle_fence"},
		    {text:"Acacia Fence (265)",value:"acacia_fence"},
		    {text:"Dark Oak Fence (266)",value:"dark_oak_fence"},
		    {text:"Mangrove Fence (267)",value:"mangrove_fence"},
		    {text:"Crimson Fence (268)",value:"crimson_fence"},
		    {text:"Warped Fence (269)",value:"warped_fence"},
		    {text:"Pumpkin (270)",value:"pumpkin"},
		    {text:"Carved Pumpkin (271)",value:"carved_pumpkin"},
		    {text:"Jack o'Lantern (272)",value:"jack_o_lantern"},
		    {text:"Netherrack (273)",value:"netherrack"},
		    {text:"Soul Sand (274)",value:"soul_sand"},
		    {text:"Soul Soil (275)",value:"soul_soil"},
		    {text:"Basalt (276)",value:"basalt"},
		    {text:"Polished Basalt (277)",value:"polished_basalt"},
		    {text:"Smooth Basalt (278)",value:"smooth_basalt"},
		    {text:"Soul Torch (279)",value:"soul_torch"},
		    {text:"Glowstone (280)",value:"glowstone"},
		    {text:"Stone Bricks (281)",value:"stone_bricks"},
		    {text:"Mossy Stone Bricks (282)",value:"mossy_stone_bricks"},
		    {text:"Cracked Stone Bricks (283)",value:"cracked_stone_bricks"},
		    {text:"Chiseled Stone Bricks (284)",value:"chiseled_stone_bricks"},
		    {text:"Packed Mud (285)",value:"packed_mud"},
		    {text:"Mud Bricks (286)",value:"mud_bricks"},
		    {text:"Deepslate Bricks (287)",value:"deepslate_bricks"},
		    {text:"Cracked Deepslate Bricks (288)",value:"cracked_deepslate_bricks"},
		    {text:"Deepslate Tiles (289)",value:"deepslate_tiles"},
		    {text:"Cracked Deepslate Tiles (290)",value:"cracked_deepslate_tiles"},
		    {text:"Chiseled Deepslate (291)",value:"chiseled_deepslate"},
		    {text:"Brown Mushroom Block (292)",value:"brown_mushroom_block"},
		    {text:"Red Mushroom Block (293)",value:"red_mushroom_block"},
		    {text:"Mushroom Stem (294)",value:"mushroom_stem"},
		    {text:"Iron Bars (295)",value:"iron_bars"},
		    {text:"Chain (296)",value:"chain"},
		    {text:"Glass Pane (297)",value:"glass_pane"},
		    {text:"Melon (298)",value:"melon"},
		    {text:"Vines (299)",value:"vine"},
		    {text:"Glow Lichen (300)",value:"glow_lichen"},
		    {text:"Brick Stairs (301)",value:"brick_stairs"},
		    {text:"Stone Brick Stairs (302)",value:"stone_brick_stairs"},
		    {text:"Mud Brick Stairs (303)",value:"mud_brick_stairs"},
		    {text:"Mycelium (304)",value:"mycelium"},
		    {text:"Lily Pad (305)",value:"lily_pad"},
		    {text:"Nether Bricks (306)",value:"nether_bricks"},
		    {text:"Cracked Nether Bricks (307)",value:"cracked_nether_bricks"},
		    {text:"Chiseled Nether Bricks (308)",value:"chiseled_nether_bricks"},
		    {text:"Nether Brick Fence (309)",value:"nether_brick_fence"},
		    {text:"Nether Brick Stairs (310)",value:"nether_brick_stairs"},
		    {text:"Sculk (311)",value:"sculk"},
		    {text:"Sculk Vein (312)",value:"sculk_vein"},
		    {text:"Sculk Catalyst (313)",value:"sculk_catalyst"},
		    {text:"Sculk Shrieker (314)",value:"sculk_shrieker"},
		    {text:"Enchanting Table (315)",value:"enchanting_table"},
		    {text:"End Stone (316)",value:"end_stone"},
		    {text:"End Stone Bricks (317)",value:"end_stone_bricks"},
		    {text:"Dragon Egg (318)",value:"dragon_egg"},
		    {text:"Sandstone Stairs (319)",value:"sandstone_stairs"},
		    {text:"Ender Chest (320)",value:"ender_chest"},
		    {text:"Block of Emerald (321)",value:"emerald_block"},
		    {text:"Oak Stairs (322)",value:"oak_stairs"},
		    {text:"Spruce Stairs (323)",value:"spruce_stairs"},
		    {text:"Birch Stairs (324)",value:"birch_stairs"},
		    {text:"Jungle Stairs (325)",value:"jungle_stairs"},
		    {text:"Acacia Stairs (326)",value:"acacia_stairs"},
		    {text:"Dark Oak Stairs (327)",value:"dark_oak_stairs"},
		    {text:"Mangrove Stairs (328)",value:"mangrove_stairs"},
		    {text:"Crimson Stairs (329)",value:"crimson_stairs"},
		    {text:"Warped Stairs (330)",value:"warped_stairs"},
		    {text:"Beacon (331)",value:"beacon"},
		    {text:"Cobblestone Wall (332)",value:"cobblestone_wall"},
		    {text:"Mossy Cobblestone Wall (333)",value:"mossy_cobblestone_wall"},
		    {text:"Brick Wall (334)",value:"brick_wall"},
		    {text:"Prismarine Wall (335)",value:"prismarine_wall"},
		    {text:"Red Sandstone Wall (336)",value:"red_sandstone_wall"},
		    {text:"Mossy Stone Brick Wall (337)",value:"mossy_stone_brick_wall"},
		    {text:"Granite Wall (338)",value:"granite_wall"},
		    {text:"Stone Brick Wall (339)",value:"stone_brick_wall"},
		    {text:"Mud Brick Wall (340)",value:"mud_brick_wall"},
		    {text:"Nether Brick Wall (341)",value:"nether_brick_wall"},
		    {text:"Andesite Wall (342)",value:"andesite_wall"},
		    {text:"Red Nether Brick Wall (343)",value:"red_nether_brick_wall"},
		    {text:"Sandstone Wall (344)",value:"sandstone_wall"},
		    {text:"End Stone Brick Wall (345)",value:"end_stone_brick_wall"},
		    {text:"Diorite Wall (346)",value:"diorite_wall"},
		    {text:"Blackstone Wall (347)",value:"blackstone_wall"},
		    {text:"Polished Blackstone Wall (348)",value:"polished_blackstone_wall"},
		    {text:"Polished Blackstone Brick Wall (349)",value:"polished_blackstone_brick_wall"},
		    {text:"Cobbled Deepslate Wall (350)",value:"cobbled_deepslate_wall"},
		    {text:"Polished Deepslate Wall (351)",value:"polished_deepslate_wall"},
		    {text:"Deepslate Brick Wall (352)",value:"deepslate_brick_wall"},
		    {text:"Deepslate Tile Wall (353)",value:"deepslate_tile_wall"},
		    {text:"Anvil (354)",value:"anvil"},
		    {text:"Chipped Anvil (355)",value:"chipped_anvil"},
		    {text:"Damaged Anvil (356)",value:"damaged_anvil"},
		    {text:"Chiseled Quartz Block (357)",value:"chiseled_quartz_block"},
		    {text:"Block of Quartz (358)",value:"quartz_block"},
		    {text:"Quartz Bricks (359)",value:"quartz_bricks"},
		    {text:"Quartz Pillar (360)",value:"quartz_pillar"},
		    {text:"Quartz Stairs (361)",value:"quartz_stairs"},
		    {text:"White Terracotta (362)",value:"white_terracotta"},
		    {text:"Orange Terracotta (363)",value:"orange_terracotta"},
		    {text:"Magenta Terracotta (364)",value:"magenta_terracotta"},
		    {text:"Light Blue Terracotta (365)",value:"light_blue_terracotta"},
		    {text:"Yellow Terracotta (366)",value:"yellow_terracotta"},
		    {text:"Lime Terracotta (367)",value:"lime_terracotta"},
		    {text:"Pink Terracotta (368)",value:"pink_terracotta"},
		    {text:"Gray Terracotta (369)",value:"gray_terracotta"},
		    {text:"Light Gray Terracotta (370)",value:"light_gray_terracotta"},
		    {text:"Cyan Terracotta (371)",value:"cyan_terracotta"},
		    {text:"Purple Terracotta (372)",value:"purple_terracotta"},
		    {text:"Blue Terracotta (373)",value:"blue_terracotta"},
		    {text:"Brown Terracotta (374)",value:"brown_terracotta"},
		    {text:"Green Terracotta (375)",value:"green_terracotta"},
		    {text:"Red Terracotta (376)",value:"red_terracotta"},
		    {text:"Black Terracotta (377)",value:"black_terracotta"},
		    {text:"Hay Bale (378)",value:"hay_block"},
		    {text:"White Carpet (379)",value:"white_carpet"},
		    {text:"Orange Carpet (380)",value:"orange_carpet"},
		    {text:"Magenta Carpet (381)",value:"magenta_carpet"},
		    {text:"Light Blue Carpet (382)",value:"light_blue_carpet"},
		    {text:"Yellow Carpet (383)",value:"yellow_carpet"},
		    {text:"Lime Carpet (384)",value:"lime_carpet"},
		    {text:"Pink Carpet (385)",value:"pink_carpet"},
		    {text:"Gray Carpet (386)",value:"gray_carpet"},
		    {text:"Light Gray Carpet (387)",value:"light_gray_carpet"},
		    {text:"Cyan Carpet (388)",value:"cyan_carpet"},
		    {text:"Purple Carpet (389)",value:"purple_carpet"},
		    {text:"Blue Carpet (390)",value:"blue_carpet"},
		    {text:"Brown Carpet (391)",value:"brown_carpet"},
		    {text:"Green Carpet (392)",value:"green_carpet"},
		    {text:"Red Carpet (393)",value:"red_carpet"},
		    {text:"Black Carpet (394)",value:"black_carpet"},
		    {text:"Terracotta (395)",value:"terracotta"},
		    {text:"Packed Ice (396)",value:"packed_ice"},
		    {text:"Sunflower (397)",value:"sunflower"},
		    {text:"Lilac (398)",value:"lilac"},
		    {text:"Rose Bush (399)",value:"rose_bush"},
		    {text:"Peony (400)",value:"peony"},
		    {text:"Tall Grass (401)",value:"tall_grass"},
		    {text:"Large Fern (402)",value:"large_fern"},
		    {text:"White Stained Glass (403)",value:"white_stained_glass"},
		    {text:"Orange Stained Glass (404)",value:"orange_stained_glass"},
		    {text:"Magenta Stained Glass (405)",value:"magenta_stained_glass"},
		    {text:"Light Blue Stained Glass (406)",value:"light_blue_stained_glass"},
		    {text:"Yellow Stained Glass (407)",value:"yellow_stained_glass"},
		    {text:"Lime Stained Glass (408)",value:"lime_stained_glass"},
		    {text:"Pink Stained Glass (409)",value:"pink_stained_glass"},
		    {text:"Gray Stained Glass (410)",value:"gray_stained_glass"},
		    {text:"Light Gray Stained Glass (411)",value:"light_gray_stained_glass"},
		    {text:"Cyan Stained Glass (412)",value:"cyan_stained_glass"},
		    {text:"Purple Stained Glass (413)",value:"purple_stained_glass"},
		    {text:"Blue Stained Glass (414)",value:"blue_stained_glass"},
		    {text:"Brown Stained Glass (415)",value:"brown_stained_glass"},
		    {text:"Green Stained Glass (416)",value:"green_stained_glass"},
		    {text:"Red Stained Glass (417)",value:"red_stained_glass"},
		    {text:"Black Stained Glass (418)",value:"black_stained_glass"},
		    {text:"White Stained Glass Pane (419)",value:"white_stained_glass_pane"},
		    {text:"Orange Stained Glass Pane (420)",value:"orange_stained_glass_pane"},
		    {text:"Magenta Stained Glass Pane (421)",value:"magenta_stained_glass_pane"},
		    {text:"Light Blue Stained Glass Pane (422)",value:"light_blue_stained_glass_pane"},
		    {text:"Yellow Stained Glass Pane (423)",value:"yellow_stained_glass_pane"},
		    {text:"Lime Stained Glass Pane (424)",value:"lime_stained_glass_pane"},
		    {text:"Pink Stained Glass Pane (425)",value:"pink_stained_glass_pane"},
		    {text:"Gray Stained Glass Pane (426)",value:"gray_stained_glass_pane"},
		    {text:"Light Gray Stained Glass Pane (427)",value:"light_gray_stained_glass_pane"},
		    {text:"Cyan Stained Glass Pane (428)",value:"cyan_stained_glass_pane"},
		    {text:"Purple Stained Glass Pane (429)",value:"purple_stained_glass_pane"},
		    {text:"Blue Stained Glass Pane (430)",value:"blue_stained_glass_pane"},
		    {text:"Brown Stained Glass Pane (431)",value:"brown_stained_glass_pane"},
		    {text:"Green Stained Glass Pane (432)",value:"green_stained_glass_pane"},
		    {text:"Red Stained Glass Pane (433)",value:"red_stained_glass_pane"},
		    {text:"Black Stained Glass Pane (434)",value:"black_stained_glass_pane"},
		    {text:"Prismarine (435)",value:"prismarine"},
		    {text:"Prismarine Bricks (436)",value:"prismarine_bricks"},
		    {text:"Dark Prismarine (437)",value:"dark_prismarine"},
		    {text:"Prismarine Stairs (438)",value:"prismarine_stairs"},
		    {text:"Prismarine Brick Stairs (439)",value:"prismarine_brick_stairs"},
		    {text:"Dark Prismarine Stairs (440)",value:"dark_prismarine_stairs"},
		    {text:"Sea Lantern (441)",value:"sea_lantern"},
		    {text:"Red Sandstone (442)",value:"red_sandstone"},
		    {text:"Chiseled Red Sandstone (443)",value:"chiseled_red_sandstone"},
		    {text:"Cut Red Sandstone (444)",value:"cut_red_sandstone"},
		    {text:"Red Sandstone Stairs (445)",value:"red_sandstone_stairs"},
		    {text:"Magma Block (446)",value:"magma_block"},
		    {text:"Nether Wart Block (447)",value:"nether_wart_block"},
		    {text:"Warped Wart Block (448)",value:"warped_wart_block"},
		    {text:"Red Nether Bricks (449)",value:"red_nether_bricks"},
		    {text:"Bone Block (450)",value:"bone_block"},
		    {text:"Shulker Box (451)",value:"shulker_box"},
		    {text:"White Shulker Box (452)",value:"white_shulker_box"},
		    {text:"Orange Shulker Box (453)",value:"orange_shulker_box"},
		    {text:"Magenta Shulker Box (454)",value:"magenta_shulker_box"},
		    {text:"Light Blue Shulker Box (455)",value:"light_blue_shulker_box"},
		    {text:"Yellow Shulker Box (456)",value:"yellow_shulker_box"},
		    {text:"Lime Shulker Box (457)",value:"lime_shulker_box"},
		    {text:"Pink Shulker Box (458)",value:"pink_shulker_box"},
		    {text:"Gray Shulker Box (459)",value:"gray_shulker_box"},
		    {text:"Light Gray Shulker Box (460)",value:"light_gray_shulker_box"},
		    {text:"Cyan Shulker Box (461)",value:"cyan_shulker_box"},
		    {text:"Purple Shulker Box (462)",value:"purple_shulker_box"},
		    {text:"Blue Shulker Box (463)",value:"blue_shulker_box"},
		    {text:"Brown Shulker Box (464)",value:"brown_shulker_box"},
		    {text:"Green Shulker Box (465)",value:"green_shulker_box"},
		    {text:"Red Shulker Box (466)",value:"red_shulker_box"},
		    {text:"Black Shulker Box (467)",value:"black_shulker_box"},
		    {text:"White Glazed Terracotta (468)",value:"white_glazed_terracotta"},
		    {text:"Orange Glazed Terracotta (469)",value:"orange_glazed_terracotta"},
		    {text:"Magenta Glazed Terracotta (470)",value:"magenta_glazed_terracotta"},
		    {text:"Light Blue Glazed Terracotta (471)",value:"light_blue_glazed_terracotta"},
		    {text:"Yellow Glazed Terracotta (472)",value:"yellow_glazed_terracotta"},
		    {text:"Lime Glazed Terracotta (473)",value:"lime_glazed_terracotta"},
		    {text:"Pink Glazed Terracotta (474)",value:"pink_glazed_terracotta"},
		    {text:"Gray Glazed Terracotta (475)",value:"gray_glazed_terracotta"},
		    {text:"Light Gray Glazed Terracotta (476)",value:"light_gray_glazed_terracotta"},
		    {text:"Cyan Glazed Terracotta (477)",value:"cyan_glazed_terracotta"},
		    {text:"Purple Glazed Terracotta (478)",value:"purple_glazed_terracotta"},
		    {text:"Blue Glazed Terracotta (479)",value:"blue_glazed_terracotta"},
		    {text:"Brown Glazed Terracotta (480)",value:"brown_glazed_terracotta"},
		    {text:"Green Glazed Terracotta (481)",value:"green_glazed_terracotta"},
		    {text:"Red Glazed Terracotta (482)",value:"red_glazed_terracotta"},
		    {text:"Black Glazed Terracotta (483)",value:"black_glazed_terracotta"},
		    {text:"White Concrete (484)",value:"white_concrete"},
		    {text:"Orange Concrete (485)",value:"orange_concrete"},
		    {text:"Magenta Concrete (486)",value:"magenta_concrete"},
		    {text:"Light Blue Concrete (487)",value:"light_blue_concrete"},
		    {text:"Yellow Concrete (488)",value:"yellow_concrete"},
		    {text:"Lime Concrete (489)",value:"lime_concrete"},
		    {text:"Pink Concrete (490)",value:"pink_concrete"},
		    {text:"Gray Concrete (491)",value:"gray_concrete"},
		    {text:"Light Gray Concrete (492)",value:"light_gray_concrete"},
		    {text:"Cyan Concrete (493)",value:"cyan_concrete"},
		    {text:"Purple Concrete (494)",value:"purple_concrete"},
		    {text:"Blue Concrete (495)",value:"blue_concrete"},
		    {text:"Brown Concrete (496)",value:"brown_concrete"},
		    {text:"Green Concrete (497)",value:"green_concrete"},
		    {text:"Red Concrete (498)",value:"red_concrete"},
		    {text:"Black Concrete (499)",value:"black_concrete"},
		    {text:"White Concrete Powder (500)",value:"white_concrete_powder"},
		    {text:"Orange Concrete Powder (501)",value:"orange_concrete_powder"},
		    {text:"Magenta Concrete Powder (502)",value:"magenta_concrete_powder"},
		    {text:"Light Blue Concrete Powder (503)",value:"light_blue_concrete_powder"},
		    {text:"Yellow Concrete Powder (504)",value:"yellow_concrete_powder"},
		    {text:"Lime Concrete Powder (505)",value:"lime_concrete_powder"},
		    {text:"Pink Concrete Powder (506)",value:"pink_concrete_powder"},
		    {text:"Gray Concrete Powder (507)",value:"gray_concrete_powder"},
		    {text:"Light Gray Concrete Powder (508)",value:"light_gray_concrete_powder"},
		    {text:"Cyan Concrete Powder (509)",value:"cyan_concrete_powder"},
		    {text:"Purple Concrete Powder (510)",value:"purple_concrete_powder"},
		    {text:"Blue Concrete Powder (511)",value:"blue_concrete_powder"},
		    {text:"Brown Concrete Powder (512)",value:"brown_concrete_powder"},
		    {text:"Green Concrete Powder (513)",value:"green_concrete_powder"},
		    {text:"Red Concrete Powder (514)",value:"red_concrete_powder"},
		    {text:"Black Concrete Powder (515)",value:"black_concrete_powder"},
		    {text:"Turtle Egg (516)",value:"turtle_egg"},
		    {text:"Dead Tube Coral Block (517)",value:"dead_tube_coral_block"},
		    {text:"Dead Brain Coral Block (518)",value:"dead_brain_coral_block"},
		    {text:"Dead Bubble Coral Block (519)",value:"dead_bubble_coral_block"},
		    {text:"Dead Fire Coral Block (520)",value:"dead_fire_coral_block"},
		    {text:"Dead Horn Coral Block (521)",value:"dead_horn_coral_block"},
		    {text:"Tube Coral Block (522)",value:"tube_coral_block"},
		    {text:"Brain Coral Block (523)",value:"brain_coral_block"},
		    {text:"Bubble Coral Block (524)",value:"bubble_coral_block"},
		    {text:"Fire Coral Block (525)",value:"fire_coral_block"},
		    {text:"Horn Coral Block (526)",value:"horn_coral_block"},
		    {text:"Tube Coral (527)",value:"tube_coral"},
		    {text:"Brain Coral (528)",value:"brain_coral"},
		    {text:"Bubble Coral (529)",value:"bubble_coral"},
		    {text:"Fire Coral (530)",value:"fire_coral"},
		    {text:"Horn Coral (531)",value:"horn_coral"},
		    {text:"Dead Brain Coral (532)",value:"dead_brain_coral"},
		    {text:"Dead Bubble Coral (533)",value:"dead_bubble_coral"},
		    {text:"Dead Fire Coral (534)",value:"dead_fire_coral"},
		    {text:"Dead Horn Coral (535)",value:"dead_horn_coral"},
		    {text:"Dead Tube Coral (536)",value:"dead_tube_coral"},
		    {text:"Tube Coral Fan (537)",value:"tube_coral_fan"},
		    {text:"Brain Coral Fan (538)",value:"brain_coral_fan"},
		    {text:"Bubble Coral Fan (539)",value:"bubble_coral_fan"},
		    {text:"Fire Coral Fan (540)",value:"fire_coral_fan"},
		    {text:"Horn Coral Fan (541)",value:"horn_coral_fan"},
		    {text:"Dead Tube Coral Fan (542)",value:"dead_tube_coral_fan"},
		    {text:"Dead Brain Coral Fan (543)",value:"dead_brain_coral_fan"},
		    {text:"Dead Bubble Coral Fan (544)",value:"dead_bubble_coral_fan"},
		    {text:"Dead Fire Coral Fan (545)",value:"dead_fire_coral_fan"},
		    {text:"Dead Horn Coral Fan (546)",value:"dead_horn_coral_fan"},
		    {text:"Blue Ice (547)",value:"blue_ice"},
		    {text:"Conduit (548)",value:"conduit"},
		    {text:"Polished Granite Stairs (549)",value:"polished_granite_stairs"},
		    {text:"Smooth Red Sandstone Stairs (550)",value:"smooth_red_sandstone_stairs"},
		    {text:"Mossy Stone Brick Stairs (551)",value:"mossy_stone_brick_stairs"},
		    {text:"Polished Diorite Stairs (552)",value:"polished_diorite_stairs"},
		    {text:"Mossy Cobblestone Stairs (553)",value:"mossy_cobblestone_stairs"},
		    {text:"End Stone Brick Stairs (554)",value:"end_stone_brick_stairs"},
		    {text:"Stone Stairs (555)",value:"stone_stairs"},
		    {text:"Smooth Sandstone Stairs (556)",value:"smooth_sandstone_stairs"},
		    {text:"Smooth Quartz Stairs (557)",value:"smooth_quartz_stairs"},
		    {text:"Granite Stairs (558)",value:"granite_stairs"},
		    {text:"Andesite Stairs (559)",value:"andesite_stairs"},
		    {text:"Red Nether Brick Stairs (560)",value:"red_nether_brick_stairs"},
		    {text:"Polished Andesite Stairs (561)",value:"polished_andesite_stairs"},
		    {text:"Diorite Stairs (562)",value:"diorite_stairs"},
		    {text:"Cobbled Deepslate Stairs (563)",value:"cobbled_deepslate_stairs"},
		    {text:"Polished Deepslate Stairs (564)",value:"polished_deepslate_stairs"},
		    {text:"Deepslate Brick Stairs (565)",value:"deepslate_brick_stairs"},
		    {text:"Deepslate Tile Stairs (566)",value:"deepslate_tile_stairs"},
		    {text:"Polished Granite Slab (567)",value:"polished_granite_slab"},
		    {text:"Smooth Red Sandstone Slab (568)",value:"smooth_red_sandstone_slab"},
		    {text:"Mossy Stone Brick Slab (569)",value:"mossy_stone_brick_slab"},
		    {text:"Polished Diorite Slab (570)",value:"polished_diorite_slab"},
		    {text:"Mossy Cobblestone Slab (571)",value:"mossy_cobblestone_slab"},
		    {text:"End Stone Brick Slab (572)",value:"end_stone_brick_slab"},
		    {text:"Smooth Sandstone Slab (573)",value:"smooth_sandstone_slab"},
		    {text:"Smooth Quartz Slab (574)",value:"smooth_quartz_slab"},
		    {text:"Granite Slab (575)",value:"granite_slab"},
		    {text:"Andesite Slab (576)",value:"andesite_slab"},
		    {text:"Red Nether Brick Slab (577)",value:"red_nether_brick_slab"},
		    {text:"Polished Andesite Slab (578)",value:"polished_andesite_slab"},
		    {text:"Diorite Slab (579)",value:"diorite_slab"},
		    {text:"Cobbled Deepslate Slab (580)",value:"cobbled_deepslate_slab"},
		    {text:"Polished Deepslate Slab (581)",value:"polished_deepslate_slab"},
		    {text:"Deepslate Brick Slab (582)",value:"deepslate_brick_slab"},
		    {text:"Deepslate Tile Slab (583)",value:"deepslate_tile_slab"},
		    {text:"Scaffolding (584)",value:"scaffolding"},
		    {text:"Redstone Wire (585)",value:"redstone_wire"},
		    {text:"Redstone Torch (586)",value:"redstone_torch"},
		    {text:"Block of Redstone (587)",value:"redstone_block"},
		    {text:"Redstone Repeater (588)",value:"repeater"},
		    {text:"Redstone Comparator (589)",value:"comparator"},
		    {text:"Piston (590)",value:"piston"},
		    {text:"Sticky Piston (591)",value:"sticky_piston"},
		    {text:"Slime Block (592)",value:"slime_block"},
		    {text:"Honey Block (593)",value:"honey_block"},
		    {text:"Observer (594)",value:"observer"},
		    {text:"Hopper (595)",value:"hopper"},
		    {text:"Dispenser (596)",value:"dispenser"},
		    {text:"Dropper (597)",value:"dropper"},
		    {text:"Lectern (598)",value:"lectern"},
		    {text:"Target (599)",value:"target"},
		    {text:"Lever (600)",value:"lever"},
		    {text:"Lightning Rod (601)",value:"lightning_rod"},
		    {text:"Daylight Detector (602)",value:"daylight_detector"},
		    {text:"Sculk Sensor (603)",value:"sculk_sensor"},
		    {text:"Tripwire Hook (604)",value:"tripwire_hook"},
		    {text:"Trapped Chest (605)",value:"trapped_chest"},
		    {text:"TNT (606)",value:"tnt"},
		    {text:"Redstone Lamp (607)",value:"redstone_lamp"},
		    {text:"Note Block (608)",value:"note_block"},
		    {text:"Stone Button (609)",value:"stone_button"},
		    {text:"Polished Blackstone Button (610)",value:"polished_blackstone_button"},
		    {text:"Oak Button (611)",value:"oak_button"},
		    {text:"Spruce Button (612)",value:"spruce_button"},
		    {text:"Birch Button (613)",value:"birch_button"},
		    {text:"Jungle Button (614)",value:"jungle_button"},
		    {text:"Acacia Button (615)",value:"acacia_button"},
		    {text:"Dark Oak Button (616)",value:"dark_oak_button"},
		    {text:"Mangrove Button (617)",value:"mangrove_button"},
		    {text:"Crimson Button (618)",value:"crimson_button"},
		    {text:"Warped Button (619)",value:"warped_button"},
		    {text:"Stone Pressure Plate (620)",value:"stone_pressure_plate"},
		    {text:"Polished Blackstone Pressure Plate (621)",value:"polished_blackstone_pressure_plate"},
		    {text:"Light Weighted Pressure Plate (622)",value:"light_weighted_pressure_plate"},
		    {text:"Heavy Weighted Pressure Plate (623)",value:"heavy_weighted_pressure_plate"},
		    {text:"Oak Pressure Plate (624)",value:"oak_pressure_plate"},
		    {text:"Spruce Pressure Plate (625)",value:"spruce_pressure_plate"},
		    {text:"Birch Pressure Plate (626)",value:"birch_pressure_plate"},
		    {text:"Jungle Pressure Plate (627)",value:"jungle_pressure_plate"},
		    {text:"Acacia Pressure Plate (628)",value:"acacia_pressure_plate"},
		    {text:"Dark Oak Pressure Plate (629)",value:"dark_oak_pressure_plate"},
		    {text:"Mangrove Pressure Plate (630)",value:"mangrove_pressure_plate"},
		    {text:"Crimson Pressure Plate (631)",value:"crimson_pressure_plate"},
		    {text:"Warped Pressure Plate (632)",value:"warped_pressure_plate"},
		    {text:"Iron Door (633)",value:"iron_door"},
		    {text:"Oak Door (634)",value:"oak_door"},
		    {text:"Spruce Door (635)",value:"spruce_door"},
		    {text:"Birch Door (636)",value:"birch_door"},
		    {text:"Jungle Door (637)",value:"jungle_door"},
		    {text:"Acacia Door (638)",value:"acacia_door"},
		    {text:"Dark Oak Door (639)",value:"dark_oak_door"},
		    {text:"Mangrove Door (640)",value:"mangrove_door"},
		    {text:"Crimson Door (641)",value:"crimson_door"},
		    {text:"Warped Door (642)",value:"warped_door"},
		    {text:"Iron Trapdoor (643)",value:"iron_trapdoor"},
		    {text:"Oak Trapdoor (644)",value:"oak_trapdoor"},
		    {text:"Spruce Trapdoor (645)",value:"spruce_trapdoor"},
		    {text:"Birch Trapdoor (646)",value:"birch_trapdoor"},
		    {text:"Jungle Trapdoor (647)",value:"jungle_trapdoor"},
		    {text:"Acacia Trapdoor (648)",value:"acacia_trapdoor"},
		    {text:"Dark Oak Trapdoor (649)",value:"dark_oak_trapdoor"},
		    {text:"Mangrove Trapdoor (650)",value:"mangrove_trapdoor"},
		    {text:"Crimson Trapdoor (651)",value:"crimson_trapdoor"},
		    {text:"Warped Trapdoor (652)",value:"warped_trapdoor"},
		    {text:"Oak Fence Gate (653)",value:"oak_fence_gate"},
		    {text:"Spruce Fence Gate (654)",value:"spruce_fence_gate"},
		    {text:"Birch Fence Gate (655)",value:"birch_fence_gate"},
		    {text:"Jungle Fence Gate (656)",value:"jungle_fence_gate"},
		    {text:"Acacia Fence Gate (657)",value:"acacia_fence_gate"},
		    {text:"Dark Oak Fence Gate (658)",value:"dark_oak_fence_gate"},
		    {text:"Mangrove Fence Gate (659)",value:"mangrove_fence_gate"},
		    {text:"Crimson Fence Gate (660)",value:"crimson_fence_gate"},
		    {text:"Warped Fence Gate (661)",value:"warped_fence_gate"},
		    {text:"Powered Rail (662)",value:"powered_rail"},
		    {text:"Detector Rail (663)",value:"detector_rail"},
		    {text:"Rail (664)",value:"rail"},
		    {text:"Activator Rail (665)",value:"activator_rail"},
		    {text:"Saddle (666)",value:"saddle"},
		    {text:"Minecart (667)",value:"minecart"},
		    {text:"Minecart with Chest (668)",value:"chest_minecart"},
		    {text:"Minecart with Furnace (669)",value:"furnace_minecart"},
		    {text:"Minecart with TNT (670)",value:"tnt_minecart"},
		    {text:"Minecart with Hopper (671)",value:"hopper_minecart"},
		    {text:"Carrot on a Stick (672)",value:"carrot_on_a_stick"},
		    {text:"Warped Fungus on a Stick (673)",value:"warped_fungus_on_a_stick"},
		    {text:"Elytra (674)",value:"elytra"},
		    {text:"Oak Boat (675)",value:"oak_boat"},
		    {text:"Oak Boat with Chest (676)",value:"oak_chest_boat"},
		    {text:"Spruce Boat (677)",value:"spruce_boat"},
		    {text:"Spruce Boat with Chest (678)",value:"spruce_chest_boat"},
		    {text:"Birch Boat (679)",value:"birch_boat"},
		    {text:"Birch Boat with Chest (680)",value:"birch_chest_boat"},
		    {text:"Jungle Boat (681)",value:"jungle_boat"},
		    {text:"Jungle Boat with Chest (682)",value:"jungle_chest_boat"},
		    {text:"Acacia Boat (683)",value:"acacia_boat"},
		    {text:"Acacia Boat with Chest (684)",value:"acacia_chest_boat"},
		    {text:"Dark Oak Boat (685)",value:"dark_oak_boat"},
		    {text:"Dark Oak Boat with Chest (686)",value:"dark_oak_chest_boat"},
		    {text:"Mangrove Boat (687)",value:"mangrove_boat"},
		    {text:"Mangrove Boat with Chest (688)",value:"mangrove_chest_boat"},
		    {text:"Turtle Shell (689)",value:"turtle_helmet"},
		    {text:"Scute (690)",value:"scute"},
		    {text:"Flint and Steel (691)",value:"flint_and_steel"},
		    {text:"Apple (692)",value:"apple"},
		    {text:"Bow (693)",value:"bow"},
		    {text:"Arrow (694)",value:"arrow"},
		    {text:"Coal (695)",value:"coal"},
		    {text:"Charcoal (696)",value:"charcoal"},
		    {text:"Diamond (697)",value:"diamond"},
		    {text:"Emerald (698)",value:"emerald"},
		    {text:"Lapis Lazuli (699)",value:"lapis_lazuli"},
		    {text:"Nether Quartz (700)",value:"quartz"},
		    {text:"Amethyst Shard (701)",value:"amethyst_shard"},
		    {text:"Raw Iron (702)",value:"raw_iron"},
		    {text:"Iron Ingot (703)",value:"iron_ingot"},
		    {text:"Raw Copper (704)",value:"raw_copper"},
		    {text:"Copper Ingot (705)",value:"copper_ingot"},
		    {text:"Raw Gold (706)",value:"raw_gold"},
		    {text:"Gold Ingot (707)",value:"gold_ingot"},
		    {text:"Netherite Ingot (708)",value:"netherite_ingot"},
		    {text:"Netherite Scrap (709)",value:"netherite_scrap"},
		    {text:"Wooden Sword (710)",value:"wooden_sword"},
		    {text:"Wooden Shovel (711)",value:"wooden_shovel"},
		    {text:"Wooden Pickaxe (712)",value:"wooden_pickaxe"},
		    {text:"Wooden Axe (713)",value:"wooden_axe"},
		    {text:"Wooden Hoe (714)",value:"wooden_hoe"},
		    {text:"Stone Sword (715)",value:"stone_sword"},
		    {text:"Stone Shovel (716)",value:"stone_shovel"},
		    {text:"Stone Pickaxe (717)",value:"stone_pickaxe"},
		    {text:"Stone Axe (718)",value:"stone_axe"},
		    {text:"Stone Hoe (719)",value:"stone_hoe"},
		    {text:"Golden Sword (720)",value:"golden_sword"},
		    {text:"Golden Shovel (721)",value:"golden_shovel"},
		    {text:"Golden Pickaxe (722)",value:"golden_pickaxe"},
		    {text:"Golden Axe (723)",value:"golden_axe"},
		    {text:"Golden Hoe (724)",value:"golden_hoe"},
		    {text:"Iron Sword (725)",value:"iron_sword"},
		    {text:"Iron Shovel (726)",value:"iron_shovel"},
		    {text:"Iron Pickaxe (727)",value:"iron_pickaxe"},
		    {text:"Iron Axe (728)",value:"iron_axe"},
		    {text:"Iron Hoe (729)",value:"iron_hoe"},
		    {text:"Diamond Sword (730)",value:"diamond_sword"},
		    {text:"Diamond Shovel (731)",value:"diamond_shovel"},
		    {text:"Diamond Pickaxe (732)",value:"diamond_pickaxe"},
		    {text:"Diamond Axe (733)",value:"diamond_axe"},
		    {text:"Diamond Hoe (734)",value:"diamond_hoe"},
		    {text:"Netherite Sword (735)",value:"netherite_sword"},
		    {text:"Netherite Shovel (736)",value:"netherite_shovel"},
		    {text:"Netherite Pickaxe (737)",value:"netherite_pickaxe"},
		    {text:"Netherite Axe (738)",value:"netherite_axe"},
		    {text:"Netherite Hoe (739)",value:"netherite_hoe"},
		    {text:"Stick (740)",value:"stick"},
		    {text:"Bowl (741)",value:"bowl"},
		    {text:"Mushroom Stew (742)",value:"mushroom_stew"},
		    {text:"String (743)",value:"string"},
		    {text:"Feather (744)",value:"feather"},
		    {text:"Gunpowder (745)",value:"gunpowder"},
		    {text:"Wheat Seeds (746)",value:"wheat_seeds"},
		    {text:"Wheat (747)",value:"wheat"},
		    {text:"Bread (748)",value:"bread"},
		    {text:"Leather Cap (749)",value:"leather_helmet"},
		    {text:"Leather Tunic (750)",value:"leather_chestplate"},
		    {text:"Leather Pants (751)",value:"leather_leggings"},
		    {text:"Leather Boots (752)",value:"leather_boots"},
		    {text:"Chainmail Helmet (753)",value:"chainmail_helmet"},
		    {text:"Chainmail Chestplate (754)",value:"chainmail_chestplate"},
		    {text:"Chainmail Leggings (755)",value:"chainmail_leggings"},
		    {text:"Chainmail Boots (756)",value:"chainmail_boots"},
		    {text:"Iron Helmet (757)",value:"iron_helmet"},
		    {text:"Iron Chestplate (758)",value:"iron_chestplate"},
		    {text:"Iron Leggings (759)",value:"iron_leggings"},
		    {text:"Iron Boots (760)",value:"iron_boots"},
		    {text:"Diamond Helmet (761)",value:"diamond_helmet"},
		    {text:"Diamond Chestplate (762)",value:"diamond_chestplate"},
		    {text:"Diamond Leggings (763)",value:"diamond_leggings"},
		    {text:"Diamond Boots (764)",value:"diamond_boots"},
		    {text:"Golden Helmet (765)",value:"golden_helmet"},
		    {text:"Golden Chestplate (766)",value:"golden_chestplate"},
		    {text:"Golden Leggings (767)",value:"golden_leggings"},
		    {text:"Golden Boots (768)",value:"golden_boots"},
		    {text:"Netherite Helmet (769)",value:"netherite_helmet"},
		    {text:"Netherite Chestplate (770)",value:"netherite_chestplate"},
		    {text:"Netherite Leggings (771)",value:"netherite_leggings"},
		    {text:"Netherite Boots (772)",value:"netherite_boots"},
		    {text:"Flint (773)",value:"flint"},
		    {text:"Raw Porkchop (774)",value:"porkchop"},
		    {text:"Cooked Porkchop (775)",value:"cooked_porkchop"},
		    {text:"Painting (776)",value:"painting"},
		    {text:"Golden Apple (777)",value:"golden_apple"},
		    {text:"Enchanted Golden Apple (778)",value:"enchanted_golden_apple"},
		    {text:"Oak Sign (779)",value:"oak_sign"},
		    {text:"Spruce Sign (780)",value:"spruce_sign"},
		    {text:"Birch Sign (781)",value:"birch_sign"},
		    {text:"Jungle Sign (782)",value:"jungle_sign"},
		    {text:"Acacia Sign (783)",value:"acacia_sign"},
		    {text:"Dark Oak Sign (784)",value:"dark_oak_sign"},
		    {text:"Mangrove Sign (785)",value:"mangrove_sign"},
		    {text:"Crimson Sign (786)",value:"crimson_sign"},
		    {text:"Warped Sign (787)",value:"warped_sign"},
		    {text:"Bucket (788)",value:"bucket"},
		    {text:"Water Bucket (789)",value:"water_bucket"},
		    {text:"Lava Bucket (790)",value:"lava_bucket"},
		    {text:"Powder Snow Bucket (791)",value:"powder_snow_bucket"},
		    {text:"Snowball (792)",value:"snowball"},
		    {text:"Leather (793)",value:"leather"},
		    {text:"Milk Bucket (794)",value:"milk_bucket"},
		    {text:"Bucket of Pufferfish (795)",value:"pufferfish_bucket"},
		    {text:"Bucket of Salmon (796)",value:"salmon_bucket"},
		    {text:"Bucket of Cod (797)",value:"cod_bucket"},
		    {text:"Bucket of Tropical Fish (798)",value:"tropical_fish_bucket"},
		    {text:"Bucket of Axolotl (799)",value:"axolotl_bucket"},
		    {text:"Bucket of Tadpole (800)",value:"tadpole_bucket"},
		    {text:"Brick (801)",value:"brick"},
		    {text:"Clay Ball (802)",value:"clay_ball"},
		    {text:"Dried Kelp Block (803)",value:"dried_kelp_block"},
		    {text:"Paper (804)",value:"paper"},
		    {text:"Book (805)",value:"book"},
		    {text:"Slimeball (806)",value:"slime_ball"},
		    {text:"Egg (807)",value:"egg"},
		    {text:"Compass (808)",value:"compass"},
		    {text:"Recovery Compass (809)",value:"recovery_compass"},
		    {text:"Fishing Rod (810)",value:"fishing_rod"},
		    {text:"Clock (811)",value:"clock"},
		    {text:"Spyglass (812)",value:"spyglass"},
		    {text:"Glowstone Dust (813)",value:"glowstone_dust"},
		    {text:"Raw Cod (814)",value:"cod"},
		    {text:"Raw Salmon (815)",value:"salmon"},
		    {text:"Tropical Fish (816)",value:"tropical_fish"},
		    {text:"Pufferfish (817)",value:"pufferfish"},
		    {text:"Cooked Cod (818)",value:"cooked_cod"},
		    {text:"Cooked Salmon (819)",value:"cooked_salmon"},
		    {text:"Ink Sac (820)",value:"ink_sac"},
		    {text:"Glow Ink Sac (821)",value:"glow_ink_sac"},
		    {text:"Cocoa Beans (822)",value:"cocoa_beans"},
		    {text:"White Dye (823)",value:"white_dye"},
		    {text:"Orange Dye (824)",value:"orange_dye"},
		    {text:"Magenta Dye (825)",value:"magenta_dye"},
		    {text:"Light Blue Dye (826)",value:"light_blue_dye"},
		    {text:"Yellow Dye (827)",value:"yellow_dye"},
		    {text:"Lime Dye (828)",value:"lime_dye"},
		    {text:"Pink Dye (829)",value:"pink_dye"},
		    {text:"Gray Dye (830)",value:"gray_dye"},
		    {text:"Light Gray Dye (831)",value:"light_gray_dye"},
		    {text:"Cyan Dye (832)",value:"cyan_dye"},
		    {text:"Purple Dye (833)",value:"purple_dye"},
		    {text:"Blue Dye (834)",value:"blue_dye"},
		    {text:"Brown Dye (835)",value:"brown_dye"},
		    {text:"Green Dye (836)",value:"green_dye"},
		    {text:"Red Dye (837)",value:"red_dye"},
		    {text:"Black Dye (838)",value:"black_dye"},
		    {text:"Bone Meal (839)",value:"bone_meal"},
		    {text:"Bone (840)",value:"bone"},
		    {text:"Sugar (841)",value:"sugar"},
		    {text:"Cake (842)",value:"cake"},
		    {text:"White Bed (843)",value:"white_bed"},
		    {text:"Orange Bed (844)",value:"orange_bed"},
		    {text:"Magenta Bed (845)",value:"magenta_bed"},
		    {text:"Light Blue Bed (846)",value:"light_blue_bed"},
		    {text:"Yellow Bed (847)",value:"yellow_bed"},
		    {text:"Lime Bed (848)",value:"lime_bed"},
		    {text:"Pink Bed (849)",value:"pink_bed"},
		    {text:"Gray Bed (850)",value:"gray_bed"},
		    {text:"Light Gray Bed (851)",value:"light_gray_bed"},
		    {text:"Cyan Bed (852)",value:"cyan_bed"},
		    {text:"Purple Bed (853)",value:"purple_bed"},
		    {text:"Blue Bed (854)",value:"blue_bed"},
		    {text:"Brown Bed (855)",value:"brown_bed"},
		    {text:"Green Bed (856)",value:"green_bed"},
		    {text:"Red Bed (857)",value:"red_bed"},
		    {text:"Black Bed (858)",value:"black_bed"},
		    {text:"Cookie (859)",value:"cookie"},
		    {text:"Map (860)",value:"filled_map"},
		    {text:"Shears (861)",value:"shears"},
		    {text:"Melon Slice (862)",value:"melon_slice"},
		    {text:"Dried Kelp (863)",value:"dried_kelp"},
		    {text:"Pumpkin Seeds (864)",value:"pumpkin_seeds"},
		    {text:"Melon Seeds (865)",value:"melon_seeds"},
		    {text:"Raw Beef (866)",value:"beef"},
		    {text:"Steak (867)",value:"cooked_beef"},
		    {text:"Raw Chicken (868)",value:"chicken"},
		    {text:"Cooked Chicken (869)",value:"cooked_chicken"},
		    {text:"Rotten Flesh (870)",value:"rotten_flesh"},
		    {text:"Ender Pearl (871)",value:"ender_pearl"},
		    {text:"Blaze Rod (872)",value:"blaze_rod"},
		    {text:"Ghast Tear (873)",value:"ghast_tear"},
		    {text:"Gold Nugget (874)",value:"gold_nugget"},
		    {text:"Nether Wart (875)",value:"nether_wart"},
		    {text:"Potion (876)",value:"potion"},
		    {text:"Glass Bottle (877)",value:"glass_bottle"},
		    {text:"Spider Eye (878)",value:"spider_eye"},
		    {text:"Fermented Spider Eye (879)",value:"fermented_spider_eye"},
		    {text:"Blaze Powder (880)",value:"blaze_powder"},
		    {text:"Magma Cream (881)",value:"magma_cream"},
		    {text:"Brewing Stand (882)",value:"brewing_stand"},
		    {text:"Cauldron (883)",value:"cauldron"},
		    {text:"Eye of Ender (884)",value:"ender_eye"},
		    {text:"Glistering Melon Slice (885)",value:"glistering_melon_slice"},
		    {text:"Bottle o' Enchanting (886)",value:"experience_bottle"},
		    {text:"Fire Charge (887)",value:"fire_charge"},
		    {text:"Book and Quill (888)",value:"writable_book"},
		    {text:"Written Book (889)",value:"written_book"},
		    {text:"Item Frame (890)",value:"item_frame"},
		    {text:"Glow Item Frame (891)",value:"glow_item_frame"},
		    {text:"Flower Pot (892)",value:"flower_pot"},
		    {text:"Carrot (893)",value:"carrot"},
		    {text:"Potato (894)",value:"potato"},
		    {text:"Baked Potato (895)",value:"baked_potato"},
		    {text:"Poisonous Potato (896)",value:"poisonous_potato"},
		    {text:"Empty Map (897)",value:"map"},
		    {text:"Golden Carrot (898)",value:"golden_carrot"},
		    {text:"Skeleton Skull (899)",value:"skeleton_skull"},
		    {text:"Wither Skeleton Skull (900)",value:"wither_skeleton_skull"},
		    {text:"Zombie Head (901)",value:"zombie_head"},
		    {text:"Creeper Head (902)",value:"creeper_head"},
		    {text:"Dragon Head (903)",value:"dragon_head"},
		    {text:"Nether Star (904)",value:"nether_star"},
		    {text:"Pumpkin Pie (905)",value:"pumpkin_pie"},
		    {text:"Firework Rocket (906)",value:"firework_rocket"},
		    {text:"Firework Star (907)",value:"firework_star"},
		    {text:"Enchanted Book (908)",value:"enchanted_book"},
		    {text:"Nether Brick (909)",value:"nether_brick"},
		    {text:"Prismarine Shard (910)",value:"prismarine_shard"},
		    {text:"Prismarine Crystals (911)",value:"prismarine_crystals"},
		    {text:"Raw Rabbit (912)",value:"rabbit"},
		    {text:"Cooked Rabbit (913)",value:"cooked_rabbit"},
		    {text:"Rabbit Stew (914)",value:"rabbit_stew"},
		    {text:"Rabbit's Foot (915)",value:"rabbit_foot"},
		    {text:"Rabbit Hide (916)",value:"rabbit_hide"},
		    {text:"Armor Stand (917)",value:"armor_stand"},
		    {text:"Iron Horse Armor (918)",value:"iron_horse_armor"},
		    {text:"Golden Horse Armor (919)",value:"golden_horse_armor"},
		    {text:"Diamond Horse Armor (920)",value:"diamond_horse_armor"},
		    {text:"Leather Horse Armor (921)",value:"leather_horse_armor"},
		    {text:"Lead (922)",value:"lead"},
		    {text:"Name Tag (923)",value:"name_tag"},
		    {text:"Raw Mutton (924)",value:"mutton"},
		    {text:"Cooked Mutton (925)",value:"cooked_mutton"},
		    {text:"White Banner (926)",value:"white_banner"},
		    {text:"Orange Banner (927)",value:"orange_banner"},
		    {text:"Magenta Banner (928)",value:"magenta_banner"},
		    {text:"Light Blue Banner (929)",value:"light_blue_banner"},
		    {text:"Yellow Banner (930)",value:"yellow_banner"},
		    {text:"Lime Banner (931)",value:"lime_banner"},
		    {text:"Pink Banner (932)",value:"pink_banner"},
		    {text:"Gray Banner (933)",value:"gray_banner"},
		    {text:"Light Gray Banner (934)",value:"light_gray_banner"},
		    {text:"Cyan Banner (935)",value:"cyan_banner"},
		    {text:"Purple Banner (936)",value:"purple_banner"},
		    {text:"Blue Banner (937)",value:"blue_banner"},
		    {text:"Brown Banner (938)",value:"brown_banner"},
		    {text:"Green Banner (939)",value:"green_banner"},
		    {text:"Red Banner (940)",value:"red_banner"},
		    {text:"Black Banner (941)",value:"black_banner"},
		    {text:"End Crystal (942)",value:"end_crystal"},
		    {text:"Chorus Fruit (943)",value:"chorus_fruit"},
		    {text:"Popped Chorus Fruit (944)",value:"popped_chorus_fruit"},
		    {text:"Beetroot (945)",value:"beetroot"},
		    {text:"Beetroot Seeds (946)",value:"beetroot_seeds"},
		    {text:"Beetroot Soup (947)",value:"beetroot_soup"},
		    {text:"Dragon's Breath (948)",value:"dragon_breath"},
		    {text:"Splash Potion (949)",value:"splash_potion"},
		    {text:"Spectral Arrow (950)",value:"spectral_arrow"},
		    {text:"Tipped Arrow (951)",value:"tipped_arrow"},
		    {text:"Lingering Potion (952)",value:"lingering_potion"},
		    {text:"Shield (953)",value:"shield"},
		    {text:"Totem of Undying (954)",value:"totem_of_undying"},
		    {text:"Shulker Shell (955)",value:"shulker_shell"},
		    {text:"Iron Nugget (956)",value:"iron_nugget"},
		    {text:"Music Disc (957)",value:"music_disc_13"},
		    {text:"Music Disc (958)",value:"music_disc_cat"},
		    {text:"Music Disc (959)",value:"music_disc_blocks"},
		    {text:"Music Disc (960)",value:"music_disc_chirp"},
		    {text:"Music Disc (961)",value:"music_disc_far"},
		    {text:"Music Disc (962)",value:"music_disc_mall"},
		    {text:"Music Disc (963)",value:"music_disc_mellohi"},
		    {text:"Music Disc (964)",value:"music_disc_stal"},
		    {text:"Music Disc (965)",value:"music_disc_strad"},
		    {text:"Music Disc (966)",value:"music_disc_ward"},
		    {text:"Music Disc (967)",value:"music_disc_11"},
		    {text:"Music Disc (968)",value:"music_disc_wait"},
		    {text:"Music Disc (969)",value:"music_disc_otherside"},
		    {text:"Music Disc (970)",value:"music_disc_5"},
		    {text:"Music Disc (971)",value:"music_disc_pigstep"},
		    {text:"Disc Fragment (972)",value:"disc_fragment_5"},
		    {text:"Trident (973)",value:"trident"},
		    {text:"Phantom Membrane (974)",value:"phantom_membrane"},
		    {text:"Nautilus Shell (975)",value:"nautilus_shell"},
		    {text:"Heart of the Sea (976)",value:"heart_of_the_sea"},
		    {text:"Crossbow (977)",value:"crossbow"},
		    {text:"Suspicious Stew (978)",value:"suspicious_stew"},
		    {text:"Loom (979)",value:"loom"},
		    {text:"Banner Pattern (980)",value:"flower_banner_pattern"},
		    {text:"Banner Pattern (981)",value:"creeper_banner_pattern"},
		    {text:"Banner Pattern (982)",value:"skull_banner_pattern"},
		    {text:"Banner Pattern (983)",value:"mojang_banner_pattern"},
		    {text:"Banner Pattern (984)",value:"globe_banner_pattern"},
		    {text:"Banner Pattern (985)",value:"piglin_banner_pattern"},
		    {text:"Goat Horn (986)",value:"goat_horn"},
		    {text:"Composter (987)",value:"composter"},
		    {text:"Barrel (988)",value:"barrel"},
		    {text:"Smoker (989)",value:"smoker"},
		    {text:"Blast Furnace (990)",value:"blast_furnace"},
		    {text:"Cartography Table (991)",value:"cartography_table"},
		    {text:"Fletching Table (992)",value:"fletching_table"},
		    {text:"Grindstone (993)",value:"grindstone"},
		    {text:"Smithing Table (994)",value:"smithing_table"},
		    {text:"Stonecutter (995)",value:"stonecutter"},
		    {text:"Bell (996)",value:"bell"},
		    {text:"Lantern (997)",value:"lantern"},
		    {text:"Soul Lantern (998)",value:"soul_lantern"},
		    {text:"Sweet Berries (999)",value:"sweet_berries"},
		    {text:"Glow Berries (1000)",value:"glow_berries"},
		    {text:"Campfire (1001)",value:"campfire"},
		    {text:"Soul Campfire (1002)",value:"soul_campfire"},
		    {text:"Shroomlight (1003)",value:"shroomlight"},
		    {text:"Honeycomb (1004)",value:"honeycomb"},
		    {text:"Bee Nest (1005)",value:"bee_nest"},
		    {text:"Beehive (1006)",value:"beehive"},
		    {text:"Honey Bottle (1007)",value:"honey_bottle"},
		    {text:"Honeycomb Block (1008)",value:"honeycomb_block"},
		    {text:"Lodestone (1009)",value:"lodestone"},
		    {text:"Crying Obsidian (1010)",value:"crying_obsidian"},
		    {text:"Blackstone (1011)",value:"blackstone"},
		    {text:"Blackstone Slab (1012)",value:"blackstone_slab"},
		    {text:"Blackstone Stairs (1013)",value:"blackstone_stairs"},
		    {text:"Gilded Blackstone (1014)",value:"gilded_blackstone"},
		    {text:"Polished Blackstone (1015)",value:"polished_blackstone"},
		    {text:"Polished Blackstone Slab (1016)",value:"polished_blackstone_slab"},
		    {text:"Polished Blackstone Stairs (1017)",value:"polished_blackstone_stairs"},
		    {text:"Chiseled Polished Blackstone (1018)",value:"chiseled_polished_blackstone"},
		    {text:"Polished Blackstone Bricks (1019)",value:"polished_blackstone_bricks"},
		    {text:"Polished Blackstone Brick Slab (1020)",value:"polished_blackstone_brick_slab"},
		    {text:"Polished Blackstone Brick Stairs (1021)",value:"polished_blackstone_brick_stairs"},
		    {text:"Cracked Polished Blackstone Bricks (1022)",value:"cracked_polished_blackstone_bricks"},
		    {text:"Respawn Anchor (1023)",value:"respawn_anchor"},
		    {text:"Candle (1024)",value:"candle"},
		    {text:"White Candle (1025)",value:"white_candle"},
		    {text:"Orange Candle (1026)",value:"orange_candle"},
		    {text:"Magenta Candle (1027)",value:"magenta_candle"},
		    {text:"Light Blue Candle (1028)",value:"light_blue_candle"},
		    {text:"Yellow Candle (1029)",value:"yellow_candle"},
		    {text:"Lime Candle (1030)",value:"lime_candle"},
		    {text:"Pink Candle (1031)",value:"pink_candle"},
		    {text:"Gray Candle (1032)",value:"gray_candle"},
		    {text:"Light Gray Candle (1033)",value:"light_gray_candle"},
		    {text:"Cyan Candle (1034)",value:"cyan_candle"},
		    {text:"Purple Candle (1035)",value:"purple_candle"},
		    {text:"Blue Candle (1036)",value:"blue_candle"},
		    {text:"Brown Candle (1037)",value:"brown_candle"},
		    {text:"Green Candle (1038)",value:"green_candle"},
		    {text:"Red Candle (1039)",value:"red_candle"},
		    {text:"Black Candle (1040)",value:"black_candle"},
		    {text:"Small Amethyst Bud (1041)",value:"small_amethyst_bud"},
		    {text:"Medium Amethyst Bud (1042)",value:"medium_amethyst_bud"},
		    {text:"Large Amethyst Bud (1043)",value:"large_amethyst_bud"},
		    {text:"Amethyst Cluster (1044)",value:"amethyst_cluster"},
		    {text:"Pointed Dripstone (1045)",value:"pointed_dripstone"},
		    {text:"Ochre Froglight (1046)",value:"ochre_froglight"},
		    {text:"Verdant Froglight (1047)",value:"verdant_froglight"},
		    {text:"Pearlescent Froglight (1048)",value:"pearlescent_froglight"},
		    {text:"Echo Shard (1049)",value:"echo_shard"},
		    {text:"Bedrock (1050)",value:"bedrock"},
		    {text:"Budding Amethyst (1051)",value:"budding_amethyst"},
		    {text:"Petrified Oak Slab (1052)",value:"petrified_oak_slab"},
		    {text:"Chorus Plant (1053)",value:"chorus_plant"},
		    {text:"Spawner (1054)",value:"spawner"},
		    {text:"Farmland (1055)",value:"farmland"},
		    {text:"Infested Stone (1056)",value:"infested_stone"},
		    {text:"Infested Cobblestone (1057)",value:"infested_cobblestone"},
		    {text:"Infested Stone Bricks (1058)",value:"infested_stone_bricks"},
		    {text:"Infested Mossy Stone Bricks (1059)",value:"infested_mossy_stone_bricks"},
		    {text:"Infested Cracked Stone Bricks (1060)",value:"infested_cracked_stone_bricks"},
		    {text:"Infested Chiseled Stone Bricks (1061)",value:"infested_chiseled_stone_bricks"},
		    {text:"Infested Deepslate (1062)",value:"infested_deepslate"},
		    {text:"Reinforced Deepslate (1063)",value:"reinforced_deepslate"},
		    {text:"End Portal Frame (1064)",value:"end_portal_frame"},
		    {text:"Command Block (1065)",value:"command_block"},
		    {text:"Barrier (1066)",value:"barrier"},
		    {text:"Light (1067)",value:"light"},
		    {text:"Dirt Path (1068)",value:"dirt_path"},
		    {text:"Repeating Command Block (1069)",value:"repeating_command_block"},
		    {text:"Chain Command Block (1070)",value:"chain_command_block"},
		    {text:"Structure Void (1071)",value:"structure_void"},
		    {text:"Structure Block (1072)",value:"structure_block"},
		    {text:"Jigsaw Block (1073)",value:"jigsaw"},
		    {text:"Bundle (1074)",value:"bundle"},
		    {text:"Allay Spawn Egg (1075)",value:"allay_spawn_egg"},
		    {text:"Axolotl Spawn Egg (1076)",value:"axolotl_spawn_egg"},
		    {text:"Bat Spawn Egg (1077)",value:"bat_spawn_egg"},
		    {text:"Bee Spawn Egg (1078)",value:"bee_spawn_egg"},
		    {text:"Blaze Spawn Egg (1079)",value:"blaze_spawn_egg"},
		    {text:"Cat Spawn Egg (1080)",value:"cat_spawn_egg"},
		    {text:"Cave Spider Spawn Egg (1081)",value:"cave_spider_spawn_egg"},
		    {text:"Chicken Spawn Egg (1082)",value:"chicken_spawn_egg"},
		    {text:"Cod Spawn Egg (1083)",value:"cod_spawn_egg"},
		    {text:"Cow Spawn Egg (1084)",value:"cow_spawn_egg"},
		    {text:"Creeper Spawn Egg (1085)",value:"creeper_spawn_egg"},
		    {text:"Dolphin Spawn Egg (1086)",value:"dolphin_spawn_egg"},
		    {text:"Donkey Spawn Egg (1087)",value:"donkey_spawn_egg"},
		    {text:"Drowned Spawn Egg (1088)",value:"drowned_spawn_egg"},
		    {text:"Elder Guardian Spawn Egg (1089)",value:"elder_guardian_spawn_egg"},
		    {text:"Enderman Spawn Egg (1090)",value:"enderman_spawn_egg"},
		    {text:"Endermite Spawn Egg (1091)",value:"endermite_spawn_egg"},
		    {text:"Evoker Spawn Egg (1092)",value:"evoker_spawn_egg"},
		    {text:"Fox Spawn Egg (1093)",value:"fox_spawn_egg"},
		    {text:"Frog Spawn Egg (1094)",value:"frog_spawn_egg"},
		    {text:"Ghast Spawn Egg (1095)",value:"ghast_spawn_egg"},
		    {text:"Glow Squid Spawn Egg (1096)",value:"glow_squid_spawn_egg"},
		    {text:"Goat Spawn Egg (1097)",value:"goat_spawn_egg"},
		    {text:"Guardian Spawn Egg (1098)",value:"guardian_spawn_egg"},
		    {text:"Hoglin Spawn Egg (1099)",value:"hoglin_spawn_egg"},
		    {text:"Horse Spawn Egg (1100)",value:"horse_spawn_egg"},
		    {text:"Husk Spawn Egg (1101)",value:"husk_spawn_egg"},
		    {text:"Llama Spawn Egg (1102)",value:"llama_spawn_egg"},
		    {text:"Magma Cube Spawn Egg (1103)",value:"magma_cube_spawn_egg"},
		    {text:"Mooshroom Spawn Egg (1104)",value:"mooshroom_spawn_egg"},
		    {text:"Mule Spawn Egg (1105)",value:"mule_spawn_egg"},
		    {text:"Ocelot Spawn Egg (1106)",value:"ocelot_spawn_egg"},
		    {text:"Panda Spawn Egg (1107)",value:"panda_spawn_egg"},
		    {text:"Parrot Spawn Egg (1108)",value:"parrot_spawn_egg"},
		    {text:"Phantom Spawn Egg (1109)",value:"phantom_spawn_egg"},
		    {text:"Pig Spawn Egg (1110)",value:"pig_spawn_egg"},
		    {text:"Piglin Spawn Egg (1111)",value:"piglin_spawn_egg"},
		    {text:"Piglin Brute Spawn Egg (1112)",value:"piglin_brute_spawn_egg"},
		    {text:"Pillager Spawn Egg (1113)",value:"pillager_spawn_egg"},
		    {text:"Polar Bear Spawn Egg (1114)",value:"polar_bear_spawn_egg"},
		    {text:"Pufferfish Spawn Egg (1115)",value:"pufferfish_spawn_egg"},
		    {text:"Rabbit Spawn Egg (1116)",value:"rabbit_spawn_egg"},
		    {text:"Ravager Spawn Egg (1117)",value:"ravager_spawn_egg"},
		    {text:"Salmon Spawn Egg (1118)",value:"salmon_spawn_egg"},
		    {text:"Sheep Spawn Egg (1119)",value:"sheep_spawn_egg"},
		    {text:"Shulker Spawn Egg (1120)",value:"shulker_spawn_egg"},
		    {text:"Silverfish Spawn Egg (1121)",value:"silverfish_spawn_egg"},
		    {text:"Skeleton Spawn Egg (1122)",value:"skeleton_spawn_egg"},
		    {text:"Skeleton Horse Spawn Egg (1123)",value:"skeleton_horse_spawn_egg"},
		    {text:"Slime Spawn Egg (1124)",value:"slime_spawn_egg"},
		    {text:"Spider Spawn Egg (1125)",value:"spider_spawn_egg"},
		    {text:"Squid Spawn Egg (1126)",value:"squid_spawn_egg"},
		    {text:"Stray Spawn Egg (1127)",value:"stray_spawn_egg"},
		    {text:"Strider Spawn Egg (1128)",value:"strider_spawn_egg"},
		    {text:"Tadpole Spawn Egg (1129)",value:"tadpole_spawn_egg"},
		    {text:"Trader Llama Spawn Egg (1130)",value:"trader_llama_spawn_egg"},
		    {text:"Tropical Fish Spawn Egg (1131)",value:"tropical_fish_spawn_egg"},
		    {text:"Turtle Spawn Egg (1132)",value:"turtle_spawn_egg"},
		    {text:"Vex Spawn Egg (1133)",value:"vex_spawn_egg"},
		    {text:"Villager Spawn Egg (1134)",value:"villager_spawn_egg"},
		    {text:"Vindicator Spawn Egg (1135)",value:"vindicator_spawn_egg"},
		    {text:"Wandering Trader Spawn Egg (1136)",value:"wandering_trader_spawn_egg"},
		    {text:"Warden Spawn Egg (1137)",value:"warden_spawn_egg"},
		    {text:"Witch Spawn Egg (1138)",value:"witch_spawn_egg"},
		    {text:"Wither Skeleton Spawn Egg (1139)",value:"wither_skeleton_spawn_egg"},
		    {text:"Wolf Spawn Egg (1140)",value:"wolf_spawn_egg"},
		    {text:"Zoglin Spawn Egg (1141)",value:"zoglin_spawn_egg"},
		    {text:"Zombie Spawn Egg (1142)",value:"zombie_spawn_egg"},
		    {text:"Zombie Horse Spawn Egg (1143)",value:"zombie_horse_spawn_egg"},
		    {text:"Zombie Villager Spawn Egg (1144)",value:"zombie_villager_spawn_egg"},
		    {text:"Zombified Piglin Spawn Egg (1145)",value:"zombified_piglin_spawn_egg"},
		    {text:"Player Head (1146)",value:"player_head"},
		    {text:"Minecart with Command Block (1147)",value:"command_block_minecart"},
		    {text:"Knowledge Book (1148)",value:"knowledge_book"},
		    {text:"Debug Stick (1149)",value:"debug_stick"},
		    {text:"Frogspawn (1150)",value:"frogspawn"},
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
        return name;
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

	if (isNaN(parsed)) {
	    // Block ID string
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
}

(function() {
    var extensionClass = RaspberryJamMod
    if (typeof window === "undefined" || !window.vm) {
        Scratch.extensions.register(new extensionClass())
    }
    else {
        var extensionInstance = new extensionClass(window.vm.extensionManager.runtime)
        var serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance)
        window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName)
    }
})()
