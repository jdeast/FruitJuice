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

// -------------------------------------------------------------------------
// Block registry
//
// A block's position in this array IS its block number, as used by the numeric
// "put [b] at (x,y,z)" block and by "block id of [name]". Saved projects store
// those numbers, so this list is APPEND-ONLY: never reorder it and never remove
// an entry, or old projects silently start building with different blocks.
//
// On connect we ask the server which materials it actually supports and append
// anything new to the end. Existing numbers never move.
// -------------------------------------------------------------------------
const FRUITJUICE_BLOCKS = [
    "STONE", "GRANITE", "POLISHED_GRANITE", "DIORITE", "POLISHED_DIORITE", "ANDESITE",
    "POLISHED_ANDESITE", "DEEPSLATE", "COBBLED_DEEPSLATE", "POLISHED_DEEPSLATE", "CALCITE", "TUFF",
    "DRIPSTONE_BLOCK", "GRASS_BLOCK", "DIRT", "COARSE_DIRT", "PODZOL", "ROOTED_DIRT",
    "MUD", "CRIMSON_NYLIUM", "WARPED_NYLIUM", "COBBLESTONE", "OAK_PLANKS", "SPRUCE_PLANKS",
    "BIRCH_PLANKS", "JUNGLE_PLANKS", "ACACIA_PLANKS", "DARK_OAK_PLANKS", "MANGROVE_PLANKS", "CRIMSON_PLANKS",
    "WARPED_PLANKS", "OAK_SAPLING", "SPRUCE_SAPLING", "BIRCH_SAPLING", "JUNGLE_SAPLING", "ACACIA_SAPLING",
    "DARK_OAK_SAPLING", "MANGROVE_PROPAGULE", "SAND", "RED_SAND", "GRAVEL", "COAL_ORE",
    "DEEPSLATE_COAL_ORE", "IRON_ORE", "DEEPSLATE_IRON_ORE", "COPPER_ORE", "DEEPSLATE_COPPER_ORE", "GOLD_ORE",
    "DEEPSLATE_GOLD_ORE", "REDSTONE_ORE", "DEEPSLATE_REDSTONE_ORE", "EMERALD_ORE", "DEEPSLATE_EMERALD_ORE", "LAPIS_ORE",
    "DEEPSLATE_LAPIS_ORE", "DIAMOND_ORE", "DEEPSLATE_DIAMOND_ORE", "NETHER_GOLD_ORE", "NETHER_QUARTZ_ORE", "ANCIENT_DEBRIS",
    "COAL_BLOCK", "RAW_IRON_BLOCK", "RAW_COPPER_BLOCK", "RAW_GOLD_BLOCK", "AMETHYST_BLOCK", "IRON_BLOCK",
    "COPPER_BLOCK", "GOLD_BLOCK", "DIAMOND_BLOCK", "NETHERITE_BLOCK", "EXPOSED_COPPER", "WEATHERED_COPPER",
    "OXIDIZED_COPPER", "CUT_COPPER", "EXPOSED_CUT_COPPER", "WEATHERED_CUT_COPPER", "OXIDIZED_CUT_COPPER", "CUT_COPPER_STAIRS",
    "EXPOSED_CUT_COPPER_STAIRS", "WEATHERED_CUT_COPPER_STAIRS", "OXIDIZED_CUT_COPPER_STAIRS", "CUT_COPPER_SLAB", "EXPOSED_CUT_COPPER_SLAB", "WEATHERED_CUT_COPPER_SLAB",
    "OXIDIZED_CUT_COPPER_SLAB", "WAXED_COPPER_BLOCK", "WAXED_EXPOSED_COPPER", "WAXED_WEATHERED_COPPER", "WAXED_OXIDIZED_COPPER", "WAXED_CUT_COPPER",
    "WAXED_EXPOSED_CUT_COPPER", "WAXED_WEATHERED_CUT_COPPER", "WAXED_OXIDIZED_CUT_COPPER", "WAXED_CUT_COPPER_STAIRS", "WAXED_EXPOSED_CUT_COPPER_STAIRS", "WAXED_WEATHERED_CUT_COPPER_STAIRS",
    "WAXED_OXIDIZED_CUT_COPPER_STAIRS", "WAXED_CUT_COPPER_SLAB", "WAXED_EXPOSED_CUT_COPPER_SLAB", "WAXED_WEATHERED_CUT_COPPER_SLAB", "WAXED_OXIDIZED_CUT_COPPER_SLAB", "OAK_LOG",
    "SPRUCE_LOG", "BIRCH_LOG", "JUNGLE_LOG", "ACACIA_LOG", "DARK_OAK_LOG", "MANGROVE_LOG",
    "MANGROVE_ROOTS", "MUDDY_MANGROVE_ROOTS", "CRIMSON_STEM", "WARPED_STEM", "STRIPPED_OAK_LOG", "STRIPPED_SPRUCE_LOG",
    "STRIPPED_BIRCH_LOG", "STRIPPED_JUNGLE_LOG", "STRIPPED_ACACIA_LOG", "STRIPPED_DARK_OAK_LOG", "STRIPPED_MANGROVE_LOG", "STRIPPED_CRIMSON_STEM",
    "STRIPPED_WARPED_STEM", "STRIPPED_OAK_WOOD", "STRIPPED_SPRUCE_WOOD", "STRIPPED_BIRCH_WOOD", "STRIPPED_JUNGLE_WOOD", "STRIPPED_ACACIA_WOOD",
    "STRIPPED_DARK_OAK_WOOD", "STRIPPED_MANGROVE_WOOD", "STRIPPED_CRIMSON_HYPHAE", "STRIPPED_WARPED_HYPHAE", "OAK_WOOD", "SPRUCE_WOOD",
    "BIRCH_WOOD", "JUNGLE_WOOD", "ACACIA_WOOD", "DARK_OAK_WOOD", "MANGROVE_WOOD", "CRIMSON_HYPHAE",
    "WARPED_HYPHAE", "OAK_LEAVES", "SPRUCE_LEAVES", "BIRCH_LEAVES", "JUNGLE_LEAVES", "ACACIA_LEAVES",
    "DARK_OAK_LEAVES", "MANGROVE_LEAVES", "AZALEA_LEAVES", "FLOWERING_AZALEA_LEAVES", "SPONGE", "WET_SPONGE",
    "GLASS", "TINTED_GLASS", "LAPIS_BLOCK", "SANDSTONE", "CHISELED_SANDSTONE", "CUT_SANDSTONE",
    "COBWEB", "GRASS", "FERN", "AZALEA", "FLOWERING_AZALEA", "DEAD_BUSH",
    "SEAGRASS", "SEA_PICKLE", "WHITE_WOOL", "ORANGE_WOOL", "MAGENTA_WOOL", "LIGHT_BLUE_WOOL",
    "YELLOW_WOOL", "LIME_WOOL", "PINK_WOOL", "GRAY_WOOL", "LIGHT_GRAY_WOOL", "CYAN_WOOL",
    "PURPLE_WOOL", "BLUE_WOOL", "BROWN_WOOL", "GREEN_WOOL", "RED_WOOL", "BLACK_WOOL",
    "DANDELION", "POPPY", "BLUE_ORCHID", "ALLIUM", "AZURE_BLUET", "RED_TULIP",
    "ORANGE_TULIP", "WHITE_TULIP", "PINK_TULIP", "OXEYE_DAISY", "CORNFLOWER", "LILY_OF_THE_VALLEY",
    "WITHER_ROSE", "SPORE_BLOSSOM", "BROWN_MUSHROOM", "RED_MUSHROOM", "CRIMSON_FUNGUS", "WARPED_FUNGUS",
    "CRIMSON_ROOTS", "WARPED_ROOTS", "NETHER_SPROUTS", "WEEPING_VINES", "TWISTING_VINES", "SUGAR_CANE",
    "KELP", "MOSS_CARPET", "MOSS_BLOCK", "HANGING_ROOTS", "BIG_DRIPLEAF", "SMALL_DRIPLEAF",
    "BAMBOO", "OAK_SLAB", "SPRUCE_SLAB", "BIRCH_SLAB", "JUNGLE_SLAB", "ACACIA_SLAB",
    "DARK_OAK_SLAB", "MANGROVE_SLAB", "CRIMSON_SLAB", "WARPED_SLAB", "STONE_SLAB", "SMOOTH_STONE_SLAB",
    "SANDSTONE_SLAB", "CUT_SANDSTONE_SLAB", "COBBLESTONE_SLAB", "BRICK_SLAB", "STONE_BRICK_SLAB", "MUD_BRICK_SLAB",
    "NETHER_BRICK_SLAB", "QUARTZ_SLAB", "RED_SANDSTONE_SLAB", "CUT_RED_SANDSTONE_SLAB", "PURPUR_SLAB", "PRISMARINE_SLAB",
    "PRISMARINE_BRICK_SLAB", "DARK_PRISMARINE_SLAB", "SMOOTH_QUARTZ", "SMOOTH_RED_SANDSTONE", "SMOOTH_SANDSTONE", "SMOOTH_STONE",
    "BRICKS", "BOOKSHELF", "MOSSY_COBBLESTONE", "OBSIDIAN", "TORCH", "END_ROD",
    "CHORUS_FLOWER", "PURPUR_BLOCK", "PURPUR_PILLAR", "PURPUR_STAIRS", "CHEST", "CRAFTING_TABLE",
    "FURNACE", "LADDER", "COBBLESTONE_STAIRS", "SNOW", "ICE", "SNOW_BLOCK",
    "CACTUS", "CLAY", "JUKEBOX", "OAK_FENCE", "SPRUCE_FENCE", "BIRCH_FENCE",
    "JUNGLE_FENCE", "ACACIA_FENCE", "DARK_OAK_FENCE", "MANGROVE_FENCE", "CRIMSON_FENCE", "WARPED_FENCE",
    "PUMPKIN", "CARVED_PUMPKIN", "JACK_O_LANTERN", "NETHERRACK", "SOUL_SAND", "SOUL_SOIL",
    "BASALT", "POLISHED_BASALT", "SMOOTH_BASALT", "SOUL_TORCH", "GLOWSTONE", "STONE_BRICKS",
    "MOSSY_STONE_BRICKS", "CRACKED_STONE_BRICKS", "CHISELED_STONE_BRICKS", "PACKED_MUD", "MUD_BRICKS", "DEEPSLATE_BRICKS",
    "CRACKED_DEEPSLATE_BRICKS", "DEEPSLATE_TILES", "CRACKED_DEEPSLATE_TILES", "CHISELED_DEEPSLATE", "BROWN_MUSHROOM_BLOCK", "RED_MUSHROOM_BLOCK",
    "MUSHROOM_STEM", "IRON_BARS", "CHAIN", "GLASS_PANE", "MELON", "VINE",
    "GLOW_LICHEN", "BRICK_STAIRS", "STONE_BRICK_STAIRS", "MUD_BRICK_STAIRS", "MYCELIUM", "LILY_PAD",
    "NETHER_BRICKS", "CRACKED_NETHER_BRICKS", "CHISELED_NETHER_BRICKS", "NETHER_BRICK_FENCE", "NETHER_BRICK_STAIRS", "SCULK",
    "SCULK_VEIN", "SCULK_CATALYST", "SCULK_SHRIEKER", "ENCHANTING_TABLE", "END_STONE", "END_STONE_BRICKS",
    "DRAGON_EGG", "SANDSTONE_STAIRS", "ENDER_CHEST", "EMERALD_BLOCK", "OAK_STAIRS", "SPRUCE_STAIRS",
    "BIRCH_STAIRS", "JUNGLE_STAIRS", "ACACIA_STAIRS", "DARK_OAK_STAIRS", "MANGROVE_STAIRS", "CRIMSON_STAIRS",
    "WARPED_STAIRS", "BEACON", "COBBLESTONE_WALL", "MOSSY_COBBLESTONE_WALL", "BRICK_WALL", "PRISMARINE_WALL",
    "RED_SANDSTONE_WALL", "MOSSY_STONE_BRICK_WALL", "GRANITE_WALL", "STONE_BRICK_WALL", "MUD_BRICK_WALL", "NETHER_BRICK_WALL",
    "ANDESITE_WALL", "RED_NETHER_BRICK_WALL", "SANDSTONE_WALL", "END_STONE_BRICK_WALL", "DIORITE_WALL", "BLACKSTONE_WALL",
    "POLISHED_BLACKSTONE_WALL", "POLISHED_BLACKSTONE_BRICK_WALL", "COBBLED_DEEPSLATE_WALL", "POLISHED_DEEPSLATE_WALL", "DEEPSLATE_BRICK_WALL", "DEEPSLATE_TILE_WALL",
    "ANVIL", "CHIPPED_ANVIL", "DAMAGED_ANVIL", "CHISELED_QUARTZ_BLOCK", "QUARTZ_BLOCK", "QUARTZ_BRICKS",
    "QUARTZ_PILLAR", "QUARTZ_STAIRS", "WHITE_TERRACOTTA", "ORANGE_TERRACOTTA", "MAGENTA_TERRACOTTA", "LIGHT_BLUE_TERRACOTTA",
    "YELLOW_TERRACOTTA", "LIME_TERRACOTTA", "PINK_TERRACOTTA", "GRAY_TERRACOTTA", "LIGHT_GRAY_TERRACOTTA", "CYAN_TERRACOTTA",
    "PURPLE_TERRACOTTA", "BLUE_TERRACOTTA", "BROWN_TERRACOTTA", "GREEN_TERRACOTTA", "RED_TERRACOTTA", "BLACK_TERRACOTTA",
    "HAY_BLOCK", "WHITE_CARPET", "ORANGE_CARPET", "MAGENTA_CARPET", "LIGHT_BLUE_CARPET", "YELLOW_CARPET",
    "LIME_CARPET", "PINK_CARPET", "GRAY_CARPET", "LIGHT_GRAY_CARPET", "CYAN_CARPET", "PURPLE_CARPET",
    "BLUE_CARPET", "BROWN_CARPET", "GREEN_CARPET", "RED_CARPET", "BLACK_CARPET", "TERRACOTTA",
    "PACKED_ICE", "SUNFLOWER", "LILAC", "ROSE_BUSH", "PEONY", "TALL_GRASS",
    "LARGE_FERN", "WHITE_STAINED_GLASS", "ORANGE_STAINED_GLASS", "MAGENTA_STAINED_GLASS", "LIGHT_BLUE_STAINED_GLASS", "YELLOW_STAINED_GLASS",
    "LIME_STAINED_GLASS", "PINK_STAINED_GLASS", "GRAY_STAINED_GLASS", "LIGHT_GRAY_STAINED_GLASS", "CYAN_STAINED_GLASS", "PURPLE_STAINED_GLASS",
    "BLUE_STAINED_GLASS", "BROWN_STAINED_GLASS", "GREEN_STAINED_GLASS", "RED_STAINED_GLASS", "BLACK_STAINED_GLASS", "WHITE_STAINED_GLASS_PANE",
    "ORANGE_STAINED_GLASS_PANE", "MAGENTA_STAINED_GLASS_PANE", "LIGHT_BLUE_STAINED_GLASS_PANE", "YELLOW_STAINED_GLASS_PANE", "LIME_STAINED_GLASS_PANE", "PINK_STAINED_GLASS_PANE",
    "GRAY_STAINED_GLASS_PANE", "LIGHT_GRAY_STAINED_GLASS_PANE", "CYAN_STAINED_GLASS_PANE", "PURPLE_STAINED_GLASS_PANE", "BLUE_STAINED_GLASS_PANE", "BROWN_STAINED_GLASS_PANE",
    "GREEN_STAINED_GLASS_PANE", "RED_STAINED_GLASS_PANE", "BLACK_STAINED_GLASS_PANE", "PRISMARINE", "PRISMARINE_BRICKS", "DARK_PRISMARINE",
    "PRISMARINE_STAIRS", "PRISMARINE_BRICK_STAIRS", "DARK_PRISMARINE_STAIRS", "SEA_LANTERN", "RED_SANDSTONE", "CHISELED_RED_SANDSTONE",
    "CUT_RED_SANDSTONE", "RED_SANDSTONE_STAIRS", "MAGMA_BLOCK", "NETHER_WART_BLOCK", "WARPED_WART_BLOCK", "RED_NETHER_BRICKS",
    "BONE_BLOCK", "SHULKER_BOX", "WHITE_SHULKER_BOX", "ORANGE_SHULKER_BOX", "MAGENTA_SHULKER_BOX", "LIGHT_BLUE_SHULKER_BOX",
    "YELLOW_SHULKER_BOX", "LIME_SHULKER_BOX", "PINK_SHULKER_BOX", "GRAY_SHULKER_BOX", "LIGHT_GRAY_SHULKER_BOX", "CYAN_SHULKER_BOX",
    "PURPLE_SHULKER_BOX", "BLUE_SHULKER_BOX", "BROWN_SHULKER_BOX", "GREEN_SHULKER_BOX", "RED_SHULKER_BOX", "BLACK_SHULKER_BOX",
    "WHITE_GLAZED_TERRACOTTA", "ORANGE_GLAZED_TERRACOTTA", "MAGENTA_GLAZED_TERRACOTTA", "LIGHT_BLUE_GLAZED_TERRACOTTA", "YELLOW_GLAZED_TERRACOTTA", "LIME_GLAZED_TERRACOTTA",
    "PINK_GLAZED_TERRACOTTA", "GRAY_GLAZED_TERRACOTTA", "LIGHT_GRAY_GLAZED_TERRACOTTA", "CYAN_GLAZED_TERRACOTTA", "PURPLE_GLAZED_TERRACOTTA", "BLUE_GLAZED_TERRACOTTA",
    "BROWN_GLAZED_TERRACOTTA", "GREEN_GLAZED_TERRACOTTA", "RED_GLAZED_TERRACOTTA", "BLACK_GLAZED_TERRACOTTA", "WHITE_CONCRETE", "ORANGE_CONCRETE",
    "MAGENTA_CONCRETE", "LIGHT_BLUE_CONCRETE", "YELLOW_CONCRETE", "LIME_CONCRETE", "PINK_CONCRETE", "GRAY_CONCRETE",
    "LIGHT_GRAY_CONCRETE", "CYAN_CONCRETE", "PURPLE_CONCRETE", "BLUE_CONCRETE", "BROWN_CONCRETE", "GREEN_CONCRETE",
    "RED_CONCRETE", "BLACK_CONCRETE", "WHITE_CONCRETE_POWDER", "ORANGE_CONCRETE_POWDER", "MAGENTA_CONCRETE_POWDER", "LIGHT_BLUE_CONCRETE_POWDER",
    "YELLOW_CONCRETE_POWDER", "LIME_CONCRETE_POWDER", "PINK_CONCRETE_POWDER", "GRAY_CONCRETE_POWDER", "LIGHT_GRAY_CONCRETE_POWDER", "CYAN_CONCRETE_POWDER",
    "PURPLE_CONCRETE_POWDER", "BLUE_CONCRETE_POWDER", "BROWN_CONCRETE_POWDER", "GREEN_CONCRETE_POWDER", "RED_CONCRETE_POWDER", "BLACK_CONCRETE_POWDER",
    "TURTLE_EGG", "DEAD_TUBE_CORAL_BLOCK", "DEAD_BRAIN_CORAL_BLOCK", "DEAD_BUBBLE_CORAL_BLOCK", "DEAD_FIRE_CORAL_BLOCK", "DEAD_HORN_CORAL_BLOCK",
    "TUBE_CORAL_BLOCK", "BRAIN_CORAL_BLOCK", "BUBBLE_CORAL_BLOCK", "FIRE_CORAL_BLOCK", "HORN_CORAL_BLOCK", "TUBE_CORAL",
    "BRAIN_CORAL", "BUBBLE_CORAL", "FIRE_CORAL", "HORN_CORAL", "DEAD_BRAIN_CORAL", "DEAD_BUBBLE_CORAL",
    "DEAD_FIRE_CORAL", "DEAD_HORN_CORAL", "DEAD_TUBE_CORAL", "TUBE_CORAL_FAN", "BRAIN_CORAL_FAN", "BUBBLE_CORAL_FAN",
    "FIRE_CORAL_FAN", "HORN_CORAL_FAN", "DEAD_TUBE_CORAL_FAN", "DEAD_BRAIN_CORAL_FAN", "DEAD_BUBBLE_CORAL_FAN", "DEAD_FIRE_CORAL_FAN",
    "DEAD_HORN_CORAL_FAN", "BLUE_ICE", "CONDUIT", "POLISHED_GRANITE_STAIRS", "SMOOTH_RED_SANDSTONE_STAIRS", "MOSSY_STONE_BRICK_STAIRS",
    "POLISHED_DIORITE_STAIRS", "MOSSY_COBBLESTONE_STAIRS", "END_STONE_BRICK_STAIRS", "STONE_STAIRS", "SMOOTH_SANDSTONE_STAIRS", "SMOOTH_QUARTZ_STAIRS",
    "GRANITE_STAIRS", "ANDESITE_STAIRS", "RED_NETHER_BRICK_STAIRS", "POLISHED_ANDESITE_STAIRS", "DIORITE_STAIRS", "COBBLED_DEEPSLATE_STAIRS",
    "POLISHED_DEEPSLATE_STAIRS", "DEEPSLATE_BRICK_STAIRS", "DEEPSLATE_TILE_STAIRS", "POLISHED_GRANITE_SLAB", "SMOOTH_RED_SANDSTONE_SLAB", "MOSSY_STONE_BRICK_SLAB",
    "POLISHED_DIORITE_SLAB", "MOSSY_COBBLESTONE_SLAB", "END_STONE_BRICK_SLAB", "SMOOTH_SANDSTONE_SLAB", "SMOOTH_QUARTZ_SLAB", "GRANITE_SLAB",
    "ANDESITE_SLAB", "RED_NETHER_BRICK_SLAB", "POLISHED_ANDESITE_SLAB", "DIORITE_SLAB", "COBBLED_DEEPSLATE_SLAB", "POLISHED_DEEPSLATE_SLAB",
    "DEEPSLATE_BRICK_SLAB", "DEEPSLATE_TILE_SLAB", "SCAFFOLDING", "REDSTONE", "REDSTONE_TORCH", "REDSTONE_BLOCK",
    "REPEATER", "COMPARATOR", "PISTON", "STICKY_PISTON", "SLIME_BLOCK", "HONEY_BLOCK",
    "OBSERVER", "HOPPER", "DISPENSER", "DROPPER", "LECTERN", "TARGET",
    "LEVER", "LIGHTNING_ROD", "DAYLIGHT_DETECTOR", "SCULK_SENSOR", "TRIPWIRE_HOOK", "TRAPPED_CHEST",
    "TNT", "REDSTONE_LAMP", "NOTE_BLOCK", "STONE_BUTTON", "POLISHED_BLACKSTONE_BUTTON", "OAK_BUTTON",
    "SPRUCE_BUTTON", "BIRCH_BUTTON", "JUNGLE_BUTTON", "ACACIA_BUTTON", "DARK_OAK_BUTTON", "MANGROVE_BUTTON",
    "CRIMSON_BUTTON", "WARPED_BUTTON", "STONE_PRESSURE_PLATE", "POLISHED_BLACKSTONE_PRESSURE_PLATE", "LIGHT_WEIGHTED_PRESSURE_PLATE", "HEAVY_WEIGHTED_PRESSURE_PLATE",
    "OAK_PRESSURE_PLATE", "SPRUCE_PRESSURE_PLATE", "BIRCH_PRESSURE_PLATE", "JUNGLE_PRESSURE_PLATE", "ACACIA_PRESSURE_PLATE", "DARK_OAK_PRESSURE_PLATE",
    "MANGROVE_PRESSURE_PLATE", "CRIMSON_PRESSURE_PLATE", "WARPED_PRESSURE_PLATE", "IRON_DOOR", "OAK_DOOR", "SPRUCE_DOOR",
    "BIRCH_DOOR", "JUNGLE_DOOR", "ACACIA_DOOR", "DARK_OAK_DOOR", "MANGROVE_DOOR", "CRIMSON_DOOR",
    "WARPED_DOOR", "IRON_TRAPDOOR", "OAK_TRAPDOOR", "SPRUCE_TRAPDOOR", "BIRCH_TRAPDOOR", "JUNGLE_TRAPDOOR",
    "ACACIA_TRAPDOOR", "DARK_OAK_TRAPDOOR", "MANGROVE_TRAPDOOR", "CRIMSON_TRAPDOOR", "WARPED_TRAPDOOR", "OAK_FENCE_GATE",
    "SPRUCE_FENCE_GATE", "BIRCH_FENCE_GATE", "JUNGLE_FENCE_GATE", "ACACIA_FENCE_GATE", "DARK_OAK_FENCE_GATE", "MANGROVE_FENCE_GATE",
    "CRIMSON_FENCE_GATE", "WARPED_FENCE_GATE", "POWERED_RAIL", "DETECTOR_RAIL", "RAIL", "ACTIVATOR_RAIL",
    "SADDLE", "MINECART", "CHEST_MINECART", "FURNACE_MINECART", "TNT_MINECART", "HOPPER_MINECART",
    "CARROT_ON_A_STICK", "WARPED_FUNGUS_ON_A_STICK", "ELYTRA", "OAK_BOAT", "OAK_CHEST_BOAT", "SPRUCE_BOAT",
    "SPRUCE_CHEST_BOAT", "BIRCH_BOAT", "BIRCH_CHEST_BOAT", "JUNGLE_BOAT", "JUNGLE_CHEST_BOAT", "ACACIA_BOAT",
    "ACACIA_CHEST_BOAT", "DARK_OAK_BOAT", "DARK_OAK_CHEST_BOAT", "MANGROVE_BOAT", "MANGROVE_CHEST_BOAT", "TURTLE_HELMET",
    "SCUTE", "FLINT_AND_STEEL", "APPLE", "BOW", "ARROW", "COAL",
    "CHARCOAL", "DIAMOND", "EMERALD", "LAPIS_LAZULI", "QUARTZ", "AMETHYST_SHARD",
    "RAW_IRON", "IRON_INGOT", "RAW_COPPER", "COPPER_INGOT", "RAW_GOLD", "GOLD_INGOT",
    "NETHERITE_INGOT", "NETHERITE_SCRAP", "WOODEN_SWORD", "WOODEN_SHOVEL", "WOODEN_PICKAXE", "WOODEN_AXE",
    "WOODEN_HOE", "STONE_SWORD", "STONE_SHOVEL", "STONE_PICKAXE", "STONE_AXE", "STONE_HOE",
    "GOLDEN_SWORD", "GOLDEN_SHOVEL", "GOLDEN_PICKAXE", "GOLDEN_AXE", "GOLDEN_HOE", "IRON_SWORD",
    "IRON_SHOVEL", "IRON_PICKAXE", "IRON_AXE", "IRON_HOE", "DIAMOND_SWORD", "DIAMOND_SHOVEL",
    "DIAMOND_PICKAXE", "DIAMOND_AXE", "DIAMOND_HOE", "NETHERITE_SWORD", "NETHERITE_SHOVEL", "NETHERITE_PICKAXE",
    "NETHERITE_AXE", "NETHERITE_HOE", "STICK", "BOWL", "MUSHROOM_STEW", "STRING",
    "FEATHER", "GUNPOWDER", "WHEAT_SEEDS", "WHEAT", "BREAD", "LEATHER_HELMET",
    "LEATHER_CHESTPLATE", "LEATHER_LEGGINGS", "LEATHER_BOOTS", "CHAINMAIL_HELMET", "CHAINMAIL_CHESTPLATE", "CHAINMAIL_LEGGINGS",
    "CHAINMAIL_BOOTS", "IRON_HELMET", "IRON_CHESTPLATE", "IRON_LEGGINGS", "IRON_BOOTS", "DIAMOND_HELMET",
    "DIAMOND_CHESTPLATE", "DIAMOND_LEGGINGS", "DIAMOND_BOOTS", "GOLDEN_HELMET", "GOLDEN_CHESTPLATE", "GOLDEN_LEGGINGS",
    "GOLDEN_BOOTS", "NETHERITE_HELMET", "NETHERITE_CHESTPLATE", "NETHERITE_LEGGINGS", "NETHERITE_BOOTS", "FLINT",
    "PORKCHOP", "COOKED_PORKCHOP", "PAINTING", "GOLDEN_APPLE", "ENCHANTED_GOLDEN_APPLE", "OAK_SIGN",
    "SPRUCE_SIGN", "BIRCH_SIGN", "JUNGLE_SIGN", "ACACIA_SIGN", "DARK_OAK_SIGN", "MANGROVE_SIGN",
    "CRIMSON_SIGN", "WARPED_SIGN", "BUCKET", "WATER_BUCKET", "LAVA_BUCKET", "POWDER_SNOW_BUCKET",
    "SNOWBALL", "LEATHER", "MILK_BUCKET", "PUFFERFISH_BUCKET", "SALMON_BUCKET", "COD_BUCKET",
    "TROPICAL_FISH_BUCKET", "AXOLOTL_BUCKET", "TADPOLE_BUCKET", "BRICK", "CLAY_BALL", "DRIED_KELP_BLOCK",
    "PAPER", "BOOK", "SLIME_BALL", "EGG", "COMPASS", "RECOVERY_COMPASS",
    "FISHING_ROD", "CLOCK", "SPYGLASS", "GLOWSTONE_DUST", "COD", "SALMON",
    "TROPICAL_FISH", "PUFFERFISH", "COOKED_COD", "COOKED_SALMON", "INK_SAC", "GLOW_INK_SAC",
    "COCOA_BEANS", "WHITE_DYE", "ORANGE_DYE", "MAGENTA_DYE", "LIGHT_BLUE_DYE", "YELLOW_DYE",
    "LIME_DYE", "PINK_DYE", "GRAY_DYE", "LIGHT_GRAY_DYE", "CYAN_DYE", "PURPLE_DYE",
    "BLUE_DYE", "BROWN_DYE", "GREEN_DYE", "RED_DYE", "BLACK_DYE", "BONE_MEAL",
    "BONE", "SUGAR", "CAKE", "WHITE_BED", "ORANGE_BED", "MAGENTA_BED",
    "LIGHT_BLUE_BED", "YELLOW_BED", "LIME_BED", "PINK_BED", "GRAY_BED", "LIGHT_GRAY_BED",
    "CYAN_BED", "PURPLE_BED", "BLUE_BED", "BROWN_BED", "GREEN_BED", "RED_BED",
    "BLACK_BED", "COOKIE", "FILLED_MAP", "SHEARS", "MELON_SLICE", "DRIED_KELP",
    "PUMPKIN_SEEDS", "MELON_SEEDS", "BEEF", "COOKED_BEEF", "CHICKEN", "COOKED_CHICKEN",
    "ROTTEN_FLESH", "ENDER_PEARL", "BLAZE_ROD", "GHAST_TEAR", "GOLD_NUGGET", "NETHER_WART",
    "POTION", "GLASS_BOTTLE", "SPIDER_EYE", "FERMENTED_SPIDER_EYE", "BLAZE_POWDER", "MAGMA_CREAM",
    "BREWING_STAND", "CAULDRON", "ENDER_EYE", "GLISTERING_MELON_SLICE", "EXPERIENCE_BOTTLE", "FIRE_CHARGE",
    "WRITABLE_BOOK", "WRITTEN_BOOK", "ITEM_FRAME", "GLOW_ITEM_FRAME", "FLOWER_POT", "CARROT",
    "POTATO", "BAKED_POTATO", "POISONOUS_POTATO", "MAP", "GOLDEN_CARROT", "SKELETON_SKULL",
    "WITHER_SKELETON_SKULL", "ZOMBIE_HEAD", "CREEPER_HEAD", "DRAGON_HEAD", "NETHER_STAR", "PUMPKIN_PIE",
    "FIREWORK_ROCKET", "FIREWORK_STAR", "ENCHANTED_BOOK", "NETHER_BRICK", "PRISMARINE_SHARD", "PRISMARINE_CRYSTALS",
    "RABBIT", "COOKED_RABBIT", "RABBIT_STEW", "RABBIT_FOOT", "RABBIT_HIDE", "ARMOR_STAND",
    "IRON_HORSE_ARMOR", "GOLDEN_HORSE_ARMOR", "DIAMOND_HORSE_ARMOR", "LEATHER_HORSE_ARMOR", "LEAD", "NAME_TAG",
    "MUTTON", "COOKED_MUTTON", "WHITE_BANNER", "ORANGE_BANNER", "MAGENTA_BANNER", "LIGHT_BLUE_BANNER",
    "YELLOW_BANNER", "LIME_BANNER", "PINK_BANNER", "GRAY_BANNER", "LIGHT_GRAY_BANNER", "CYAN_BANNER",
    "PURPLE_BANNER", "BLUE_BANNER", "BROWN_BANNER", "GREEN_BANNER", "RED_BANNER", "BLACK_BANNER",
    "END_CRYSTAL", "CHORUS_FRUIT", "POPPED_CHORUS_FRUIT", "BEETROOT", "BEETROOT_SEEDS", "BEETROOT_SOUP",
    "DRAGON_BREATH", "SPLASH_POTION", "SPECTRAL_ARROW", "TIPPED_ARROW", "LINGERING_POTION", "SHIELD",
    "TOTEM_OF_UNDYING", "SHULKER_SHELL", "IRON_NUGGET", "MUSIC_DISC_13", "MUSIC_DISC_CAT", "MUSIC_DISC_BLOCKS",
    "MUSIC_DISC_CHIRP", "MUSIC_DISC_FAR", "MUSIC_DISC_MALL", "MUSIC_DISC_MELLOHI", "MUSIC_DISC_STAL", "MUSIC_DISC_STRAD",
    "MUSIC_DISC_WARD", "MUSIC_DISC_11", "MUSIC_DISC_WAIT", "MUSIC_DISC_OTHERSIDE", "MUSIC_DISC_5", "MUSIC_DISC_PIGSTEP",
    "DISC_FRAGMENT_5", "TRIDENT", "PHANTOM_MEMBRANE", "NAUTILUS_SHELL", "HEART_OF_THE_SEA", "CROSSBOW",
    "SUSPICIOUS_STEW", "LOOM", "FLOWER_BANNER_PATTERN", "CREEPER_BANNER_PATTERN", "SKULL_BANNER_PATTERN", "MOJANG_BANNER_PATTERN",
    "GLOBE_BANNER_PATTERN", "PIGLIN_BANNER_PATTERN", "GOAT_HORN", "COMPOSTER", "BARREL", "SMOKER",
    "BLAST_FURNACE", "CARTOGRAPHY_TABLE", "FLETCHING_TABLE", "GRINDSTONE", "SMITHING_TABLE", "STONECUTTER",
    "BELL", "LANTERN", "SOUL_LANTERN", "SWEET_BERRIES", "GLOW_BERRIES", "CAMPFIRE",
    "SOUL_CAMPFIRE", "SHROOMLIGHT", "HONEYCOMB", "BEE_NEST", "BEEHIVE", "HONEY_BOTTLE",
    "HONEYCOMB_BLOCK", "LODESTONE", "CRYING_OBSIDIAN", "BLACKSTONE", "BLACKSTONE_SLAB", "BLACKSTONE_STAIRS",
    "GILDED_BLACKSTONE", "POLISHED_BLACKSTONE", "POLISHED_BLACKSTONE_SLAB", "POLISHED_BLACKSTONE_STAIRS", "CHISELED_POLISHED_BLACKSTONE", "POLISHED_BLACKSTONE_BRICKS",
    "POLISHED_BLACKSTONE_BRICK_SLAB", "POLISHED_BLACKSTONE_BRICK_STAIRS", "CRACKED_POLISHED_BLACKSTONE_BRICKS", "RESPAWN_ANCHOR", "CANDLE", "WHITE_CANDLE",
    "ORANGE_CANDLE", "MAGENTA_CANDLE", "LIGHT_BLUE_CANDLE", "YELLOW_CANDLE", "LIME_CANDLE", "PINK_CANDLE",
    "GRAY_CANDLE", "LIGHT_GRAY_CANDLE", "CYAN_CANDLE", "PURPLE_CANDLE", "BLUE_CANDLE", "BROWN_CANDLE",
    "GREEN_CANDLE", "RED_CANDLE", "BLACK_CANDLE", "SMALL_AMETHYST_BUD", "MEDIUM_AMETHYST_BUD", "LARGE_AMETHYST_BUD",
    "AMETHYST_CLUSTER", "POINTED_DRIPSTONE", "OCHRE_FROGLIGHT", "VERDANT_FROGLIGHT", "PEARLESCENT_FROGLIGHT", "ECHO_SHARD",
    "BEDROCK", "BUDDING_AMETHYST", "PETRIFIED_OAK_SLAB", "CHORUS_PLANT", "SPAWNER", "FARMLAND",
    "INFESTED_STONE", "INFESTED_COBBLESTONE", "INFESTED_STONE_BRICKS", "INFESTED_MOSSY_STONE_BRICKS", "INFESTED_CRACKED_STONE_BRICKS", "INFESTED_CHISELED_STONE_BRICKS",
    "INFESTED_DEEPSLATE", "REINFORCED_DEEPSLATE", "END_PORTAL_FRAME", "COMMAND_BLOCK", "BARRIER", "LIGHT",
    "DIRT_PATH", "REPEATING_COMMAND_BLOCK", "CHAIN_COMMAND_BLOCK", "STRUCTURE_VOID", "STRUCTURE_BLOCK", "JIGSAW",
    "BUNDLE", "ALLAY_SPAWN_EGG", "AXOLOTL_SPAWN_EGG", "BAT_SPAWN_EGG", "BEE_SPAWN_EGG", "BLAZE_SPAWN_EGG",
    "CAT_SPAWN_EGG", "CAVE_SPIDER_SPAWN_EGG", "CHICKEN_SPAWN_EGG", "COD_SPAWN_EGG", "COW_SPAWN_EGG", "CREEPER_SPAWN_EGG",
    "DOLPHIN_SPAWN_EGG", "DONKEY_SPAWN_EGG", "DROWNED_SPAWN_EGG", "ELDER_GUARDIAN_SPAWN_EGG", "ENDERMAN_SPAWN_EGG", "ENDERMITE_SPAWN_EGG",
    "EVOKER_SPAWN_EGG", "FOX_SPAWN_EGG", "FROG_SPAWN_EGG", "GHAST_SPAWN_EGG", "GLOW_SQUID_SPAWN_EGG", "GOAT_SPAWN_EGG",
    "GUARDIAN_SPAWN_EGG", "HOGLIN_SPAWN_EGG", "HORSE_SPAWN_EGG", "HUSK_SPAWN_EGG", "LLAMA_SPAWN_EGG", "MAGMA_CUBE_SPAWN_EGG",
    "MOOSHROOM_SPAWN_EGG", "MULE_SPAWN_EGG", "OCELOT_SPAWN_EGG", "PANDA_SPAWN_EGG", "PARROT_SPAWN_EGG", "PHANTOM_SPAWN_EGG",
    "PIG_SPAWN_EGG", "PIGLIN_SPAWN_EGG", "PIGLIN_BRUTE_SPAWN_EGG", "PILLAGER_SPAWN_EGG", "POLAR_BEAR_SPAWN_EGG", "PUFFERFISH_SPAWN_EGG",
    "RABBIT_SPAWN_EGG", "RAVAGER_SPAWN_EGG", "SALMON_SPAWN_EGG", "SHEEP_SPAWN_EGG", "SHULKER_SPAWN_EGG", "SILVERFISH_SPAWN_EGG",
    "SKELETON_SPAWN_EGG", "SKELETON_HORSE_SPAWN_EGG", "SLIME_SPAWN_EGG", "SPIDER_SPAWN_EGG", "SQUID_SPAWN_EGG", "STRAY_SPAWN_EGG",
    "STRIDER_SPAWN_EGG", "TADPOLE_SPAWN_EGG", "TRADER_LLAMA_SPAWN_EGG", "TROPICAL_FISH_SPAWN_EGG", "TURTLE_SPAWN_EGG", "VEX_SPAWN_EGG",
    "VILLAGER_SPAWN_EGG", "VINDICATOR_SPAWN_EGG", "WANDERING_TRADER_SPAWN_EGG", "WARDEN_SPAWN_EGG", "WITCH_SPAWN_EGG", "WITHER_SKELETON_SPAWN_EGG",
    "WOLF_SPAWN_EGG", "ZOGLIN_SPAWN_EGG", "ZOMBIE_SPAWN_EGG", "ZOMBIE_HORSE_SPAWN_EGG", "ZOMBIE_VILLAGER_SPAWN_EGG", "ZOMBIFIED_PIGLIN_SPAWN_EGG",
    "PLAYER_HEAD", "COMMAND_BLOCK_MINECART", "KNOWLEDGE_BOOK", "DEBUG_STICK", "FROGSPAWN",
];

// In-game names, where they differ from title-casing the material name.
const FRUITJUICE_BLOCK_LABELS = {
    "LAPIS_ORE":"Lapis Lazuli Ore", "DEEPSLATE_LAPIS_ORE":"Deepslate Lapis Lazuli Ore",
    "COAL_BLOCK":"Block of Coal", "RAW_IRON_BLOCK":"Block of Raw Iron",
    "RAW_COPPER_BLOCK":"Block of Raw Copper", "RAW_GOLD_BLOCK":"Block of Raw Gold",
    "AMETHYST_BLOCK":"Block of Amethyst", "IRON_BLOCK":"Block of Iron",
    "COPPER_BLOCK":"Block of Copper", "GOLD_BLOCK":"Block of Gold",
    "DIAMOND_BLOCK":"Block of Diamond", "NETHERITE_BLOCK":"Block of Netherite",
    "WAXED_COPPER_BLOCK":"Waxed Block of Copper", "LAPIS_BLOCK":"Block of Lapis Lazuli",
    "LILY_OF_THE_VALLEY":"Lily of the Valley", "SMOOTH_QUARTZ":"Smooth Quartz Block",
    "JACK_O_LANTERN":"Jack o'Lantern", "VINE":"Vines",
    "EMERALD_BLOCK":"Block of Emerald", "QUARTZ_BLOCK":"Block of Quartz",
    "HAY_BLOCK":"Hay Bale", "REDSTONE":"Redstone Dust",
    "REDSTONE_BLOCK":"Block of Redstone", "REPEATER":"Redstone Repeater",
    "COMPARATOR":"Redstone Comparator", "TNT":"TNT",
    "CHEST_MINECART":"Minecart with Chest", "FURNACE_MINECART":"Minecart with Furnace",
    "TNT_MINECART":"Minecart with TNT", "HOPPER_MINECART":"Minecart with Hopper",
    "CARROT_ON_A_STICK":"Carrot on a Stick", "WARPED_FUNGUS_ON_A_STICK":"Warped Fungus on a Stick",
    "OAK_CHEST_BOAT":"Oak Boat with Chest", "SPRUCE_CHEST_BOAT":"Spruce Boat with Chest",
    "BIRCH_CHEST_BOAT":"Birch Boat with Chest", "JUNGLE_CHEST_BOAT":"Jungle Boat with Chest",
    "ACACIA_CHEST_BOAT":"Acacia Boat with Chest", "DARK_OAK_CHEST_BOAT":"Dark Oak Boat with Chest",
    "MANGROVE_CHEST_BOAT":"Mangrove Boat with Chest", "TURTLE_HELMET":"Turtle Shell",
    "FLINT_AND_STEEL":"Flint and Steel", "QUARTZ":"Nether Quartz",
    "LEATHER_HELMET":"Leather Cap", "LEATHER_CHESTPLATE":"Leather Tunic",
    "LEATHER_LEGGINGS":"Leather Pants", "PORKCHOP":"Raw Porkchop",
    "PUFFERFISH_BUCKET":"Bucket of Pufferfish", "SALMON_BUCKET":"Bucket of Salmon",
    "COD_BUCKET":"Bucket of Cod", "TROPICAL_FISH_BUCKET":"Bucket of Tropical Fish",
    "AXOLOTL_BUCKET":"Bucket of Axolotl", "TADPOLE_BUCKET":"Bucket of Tadpole",
    "SLIME_BALL":"Slimeball", "COD":"Raw Cod",
    "SALMON":"Raw Salmon", "FILLED_MAP":"Map",
    "BEEF":"Raw Beef", "COOKED_BEEF":"Steak",
    "CHICKEN":"Raw Chicken", "ENDER_EYE":"Eye of Ender",
    "EXPERIENCE_BOTTLE":"Bottle o' Enchanting", "WRITABLE_BOOK":"Book and Quill",
    "MAP":"Empty Map", "RABBIT":"Raw Rabbit",
    "RABBIT_FOOT":"Rabbit's Foot", "MUTTON":"Raw Mutton",
    "DRAGON_BREATH":"Dragon's Breath", "TOTEM_OF_UNDYING":"Totem of Undying",
    "MUSIC_DISC_13":"Music Disc", "MUSIC_DISC_CAT":"Music Disc",
    "MUSIC_DISC_BLOCKS":"Music Disc", "MUSIC_DISC_CHIRP":"Music Disc",
    "MUSIC_DISC_FAR":"Music Disc", "MUSIC_DISC_MALL":"Music Disc",
    "MUSIC_DISC_MELLOHI":"Music Disc", "MUSIC_DISC_STAL":"Music Disc",
    "MUSIC_DISC_STRAD":"Music Disc", "MUSIC_DISC_WARD":"Music Disc",
    "MUSIC_DISC_11":"Music Disc", "MUSIC_DISC_WAIT":"Music Disc",
    "MUSIC_DISC_OTHERSIDE":"Music Disc", "MUSIC_DISC_5":"Music Disc",
    "MUSIC_DISC_PIGSTEP":"Music Disc", "DISC_FRAGMENT_5":"Disc Fragment",
    "HEART_OF_THE_SEA":"Heart of the Sea", "FLOWER_BANNER_PATTERN":"Banner Pattern",
    "CREEPER_BANNER_PATTERN":"Banner Pattern", "SKULL_BANNER_PATTERN":"Banner Pattern",
    "MOJANG_BANNER_PATTERN":"Banner Pattern", "GLOBE_BANNER_PATTERN":"Banner Pattern",
    "PIGLIN_BANNER_PATTERN":"Banner Pattern", "JIGSAW":"Jigsaw Block",
    "COMMAND_BLOCK_MINECART":"Minecart with Command Block",
};

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
                            "defaultValue": "localhost"
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
                    "opcode": "setBlock",
                    "blockType": "command",
                    "text": "put [b] at ([x],[y],[z]) facing [dir]",
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
                        "dir": {
                            "type": "string",
                            "defaultValue": "(default)",
                            "menu": "dirMenu"
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
            dirMenu: { acceptReporters: true,
                items: [{text:"(default)",value:"(default)"},
                        {text:"north",value:"NORTH"},
                        {text:"south",value:"SOUTH"},
                        {text:"east",value:"EAST"},
                        {text:"west",value:"WEST"},
                        {text:"up",value:"UP"},
                        {text:"down",value:"DOWN"}]
            },
            blockMenu: { acceptReporters: true, items: "getBlockMenuItems" }
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

    // Turn RED_CONCRETE into "Red Concrete (178)".
    blockLabel(name) {
        var base = FRUITJUICE_BLOCK_LABELS[name];
        if (base === undefined) {
            base = name.split("_").map(function(w) {
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            }).join(" ");
        }
        return base + " (" + this.blockNumber(name) + ")";
    };

    blockNumber(name) {
        if (this._blockNumbers === undefined) {
            this._blockNumbers = {};
            for (var i = 0; i < FRUITJUICE_BLOCKS.length; i++) {
                this._blockNumbers[FRUITJUICE_BLOCKS[i]] = i;
            }
        }
        var n = this._blockNumbers[name];
        return n === undefined ? -1 : n;
    };

    // Menu contents. Until a server tells us what it supports we show the whole
    // registry; afterwards we show only what that server can actually place,
    // which drops the items (knowledge book, debug stick, swords) that were
    // always in this list but never placeable.
    getBlockMenuItems() {
        var names = (this.serverBlocks && this.serverBlocks.length)
                  ? this.serverBlocks : FRUITJUICE_BLOCKS;
        var rjm = this;
        return names.map(function(n) {
            return {text: rjm.blockLabel(n), value: n};
        });
    };

    // Ask the server for its material list and fold in anything we do not have.
    // Appending only, so every existing block number keeps its meaning.
    refreshBlockTypes() {
        var rjm = this;
        return this.sendAndReceive("world.getBlockTypes()").then(function(reply) {
            if (!reply || reply.indexOf("Fail,") === 0) return;   // older server
            var names = reply.split(",").filter(function(n) {
                return n.length > 0 && n === n.toUpperCase() && n.indexOf(" ") < 0;
            });
            if (names.length < 50) return;                        // implausible
            rjm.blockNumber("");                                  // build the index
            names.forEach(function(n) {
                if (rjm._blockNumbers[n] === undefined) {
                    FRUITJUICE_BLOCKS.push(n);
                    rjm._blockNumbers[n] = FRUITJUICE_BLOCKS.length - 1;
                }
            });
            rjm.serverBlocks = names;
        }).catch(function() { /* keep the built-in list */ });
    };

    // Complain once per distinct problem: these run inside loops.
    blockProblem(msg) {
        if (this._warned === undefined) this._warned = {};
        console.warn("FruitJuice: " + msg);
        if (!this._warned[msg]) {
            this._warned[msg] = true;
            window.alert(msg);
        }
    };

    // Accepts a material name, a registry number, or a menu label such as
    // "Red Concrete (178)", and returns the material name.
    resolveBlock(v) {
        if (v === null || v === undefined) return v;
        var s = String(v).trim();

        var n = parseInt(s, 10);
        if (!isNaN(n) && String(n) === s) {
            var byNum = FRUITJUICE_BLOCKS[n];
            if (byNum === undefined) {
                this.blockProblem("There is no block number " + n + ".");
                return s;
            }
            return byNum;
        }

        // a menu label carries its number in trailing parentheses
        var open = s.lastIndexOf("(");
        var close = s.lastIndexOf(")");
        if (open > -1 && close === s.length - 1 && close > open + 1) {
            var inner = s.slice(open + 1, close);
            var idx = parseInt(inner, 10);
            if (String(idx) === inner && FRUITJUICE_BLOCKS[idx] !== undefined) {
                return FRUITJUICE_BLOCKS[idx];
            }
        }

        var name = s.toUpperCase().split(" ").join("_");
        if (this.serverBlocks && this.serverBlocks.length &&
            this.serverBlocks.indexOf(name) < 0) {
            this.blockProblem("This server has no block called '" + s + "'.");
        }
        return name;
    };
    blockByName({name}){
	return this.resolveBlock(name);
    }
    
    // Is there a socket, and is it actually open?
    //
    // readyState 1 is OPEN. A socket that is still CONNECTING, or one that has
    // closed, will throw on send().
    isConnected() {
        return this.socket != null && this.socket.readyState === 1;
    };

    send(msg) {
        if (!("TextEncoder" in window)) 
            alert("Sorry, this browser does not support TextEncoder...");

        // Without this, every block that sends -- chat, put block, move player
        // -- threw a TypeError on a null socket if the green flag had not
        // connected yet, or if connecting failed. In scratch that surfaced as
        // the block quietly doing nothing.
        if (!this.isConnected()) {
            this.blockProblem("Not connected to minecraft. Use the connect " +
                              "block before any other minecraft block.");
            return;
        }

        var enc = new TextEncoder(); // always utf-8
        this.socket.send(enc.encode(msg+"\n"));
    };

    // How long to wait for a reply before giving up on it.
    static get REPLY_TIMEOUT_MS() { return 10000; }

    // Install one message handler for the socket, and start an empty queue of
    // requests waiting for an answer.
    //
    // sendAndReceive used to reassign socket.onmessage on every call, with
    // nothing tying a reply to the request that caused it. Two overlapping
    // requests -- trivially easy in scratch with parallel scripts or a forever
    // loop -- clobbered each other: the first promise never settled, and the
    // second could be handed the first's answer. The server replies in the
    // order it was asked, so shifting one waiter per message pairs them up.
    attachSocketHandlers(socket) {
        var rjm = this;
        this.pending = [];

        socket.onmessage = function(event) {
            var deliver = function(text) {
                var waiter = rjm.pending.shift();
                if (waiter === undefined) return;   // nothing asked for this
                clearTimeout(waiter.timer);
                // A waiter that already timed out still owns this reply, so it
                // is consumed and dropped rather than handed to the next one
                // in the queue -- otherwise one slow answer shifts every later
                // reply onto the wrong request.
                if (!waiter.timedOut) waiter.resolve(text);
            };
            if (event.data && typeof event.data.text === "function") {
                event.data.text().then(deliver);     // a Blob, as browsers send
            } else {
                deliver(String(event.data));         // already a string
            }
        };

        socket.onerror = function(err) { rjm.failPending(err); };
        socket.onclose = function() {
            rjm.failPending(new Error("the connection to minecraft closed"));
        };
    };

    // Reject everything still waiting. Called when the socket errors or closes,
    // so blocks fail promptly instead of hanging until their timeout.
    failPending(err) {
        var waiting = this.pending || [];
        this.pending = [];
        for (var i = 0; i < waiting.length; i++) {
            clearTimeout(waiting[i].timer);
            if (!waiting[i].timedOut) waiting[i].reject(err);
        }
    };

    sendAndReceive(msg) {
        var rjm = this;
        return new Promise(function(resolve, reject) {
            if (!rjm.isConnected()) {
                rjm.blockProblem("Not connected to minecraft. Use the connect " +
                                 "block before any other minecraft block.");
                reject(new Error("not connected"));
                return;
            }
            if (rjm.pending === undefined) rjm.pending = [];

            var waiter = {resolve: resolve, reject: reject, timer: null,
                          timedOut: false, sent: msg};
            waiter.timer = setTimeout(function() {
                // Left in the queue on purpose; see the note in the handler.
                waiter.timedOut = true;
                rjm.blockProblem("Minecraft did not answer " + msg + " within " +
                                 (FruitJuice.REPLY_TIMEOUT_MS / 1000) + "s. The " +
                                 "server may be busy, or the connection may have " +
                                 "been lost.");
                reject(new Error("timed out waiting for " + msg));
            }, FruitJuice.REPLY_TIMEOUT_MS);

            rjm.pending.push(waiter);
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
    drawBlock(x,y,z,b0,dir) {

	var b = this.resolveBlock(b0);

	// The wire format takes an optional facing after the block name, and the
	// batched path below rebuilds the very same call, so appending it here
	// covers both. Omitting it lets minecraft pick its own default.
	var value = (dir && dir !== "(default)") ? b + "," + dir : b;

        if (this.savedBlocks != null) {
            this.savedBlocks.set(""+x+","+y+","+z, value);
        }
        else {
            this.send("world.setBlock("+x+","+y+","+z+","+value+")");
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
                    .then( block => block == this.resolveBlock(b) ) );
    }

    haveBlock({b,x,y,z}) {
        var [x,y,z] = this.parseXYZ(x,y,z).map(Math.floor);
//        return this.sendAndReceive("world.getBlockWithData("+x+","+y+","+z+")")
        return this.sendAndReceive("world.getBlock("+x+","+y+","+z+")")
            .then(block => {
                // resolveBlock, so a block number or a menu label like
                // "Red Wool (178)" compares correctly. Comparing the raw
                // argument only ever matched a bare material name, which
                // silently defeated the numeric API these blocks exist for.
                return block == this.resolveBlock(b);
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

    // Opens a websocket, retrying a few times before giving up.
    //
    // A browser WebSocket has no connect timeout of its own. If DNS is slow to
    // answer or the SYN is dropped, onerror never fires, so the green flag just
    // spins forever with nothing in the console. The timeout below turns that
    // silent hang into a retry, and then into a message the user can act on.
    //
    // Note we always connect by name, never by a resolved address: the server's
    // certificate lists its hostname, so connecting to a raw IP fails hostname
    // verification even when the address is correct.
    // Try a single URL once.
    openOneSocket_p(url, timeoutMs) {
        var rjm = this;
        return new Promise(function(resolve, reject) {
            if (rjm.socket != null)
                rjm.socket.close();

            rjm.clear();
            var socket = new WebSocket(url);
            rjm.socket = socket;

            var settled = false;
            var timer = setTimeout(function() {
                if (settled) return;
                settled = true;
                socket.onopen = null;
                socket.onerror = null;
                socket.close();
                reject(new Error("timed out after " + (timeoutMs / 1000) + "s"));
            }, timeoutMs);

            socket.onopen = function() {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                rjm.attachSocketHandlers(socket);
                resolve();
            };
            socket.onerror = function(err) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                reject(err);
            };
        });
    };

    // Try each URL in turn, then wait and go round again.
    //
    // There used to be a second copy of this whole file, scratch_insecure.js,
    // whose only difference was ws:// in place of wss://. One line of behaviour
    // does not justify 80KB of duplicate that has to be kept in step by hand,
    // and it made the setup guide hand out two different links.
    //
    // Secure is tried first, so a properly set up server is never downgraded.
    // The insecure attempt costs almost nothing when it is not wanted: from an
    // https page a ws:// connection is refused immediately as mixed content
    // rather than waiting out a timeout.
    openSocket_p(urls, attempt) {
        var rjm = this;
        var ATTEMPTS = 3;
        var TIMEOUT_MS = 8000;
        attempt = attempt || 1;
        if (typeof urls === "string") urls = [urls];

        var tryFrom = function(i, lastErr) {
            if (i >= urls.length) return Promise.reject(lastErr);
            return rjm.openOneSocket_p(urls[i], TIMEOUT_MS).catch(function(err) {
                console.warn("FruitJuice: " + urls[i] + " did not connect", err);
                return tryFrom(i + 1, err);
            });
        };

        return tryFrom(0, null).catch(function(err) {
            if (attempt < ATTEMPTS) {
                var delay = 1000 * attempt;
                console.warn("FruitJuice: attempt " + attempt + " failed; retrying in " +
                             (delay / 1000) + "s");
                return new Promise(function(again) { setTimeout(again, delay); })
                    .then(function() { return rjm.openSocket_p(urls, attempt + 1); });
            }

            var msg = "Could not connect to " + rjm.ip + " on port " + rjm.port +
                      " after " + ATTEMPTS + " tries.\n\n" +
                      "Check that the server name and port are spelled correctly and " +
                      "that the server is running.\n\n" +
                      "If the server was set up WITHOUT an SSL certificate, your " +
                      "browser also has to be told to allow insecure content for this " +
                      "page: click the icon at the left of the address bar, then allow " +
                      "it, then try again.";
            console.error("FruitJuice: " + msg, err);
            window.alert(msg);
            throw err;
        });
    };
    connect_p({ip,port}){
        this.ip = ip;
        this.port = port;

        var rjm = this;
        // Secure first, then insecure. This replaces having two builds of the
        // extension and two URLs in the setup guide.
        return this.openSocket_p(["wss://"+ip+":"+port, "ws://"+ip+":"+port])
            .then(result => rjm.getPosition().then( result => {
                rjm.turtle.pos = result;
            })).then (result => rjm.getRotation().then( result => {
                rjm.playerRot = result;
                rjm.turtle.matrix = rjm.turtle.yawMatrix(Math.floor(0.5+result/90)*90);
            })).then(result => rjm.refreshBlockTypes());
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
    
    setBlock({x,y,z,b,dir}) {
      var [x,y,z] = this.parseXYZ(x,y,z).map(Math.floor);
      this.drawBlock(x,y,z,b,dir);
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
