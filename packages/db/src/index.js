"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageBuckets = exports.DbValues = exports.Constants = void 0;
var database_types_1 = require("./database.types");
Object.defineProperty(exports, "Constants", { enumerable: true, get: function () { return database_types_1.Constants; } });
var values_1 = require("./values");
Object.defineProperty(exports, "DbValues", { enumerable: true, get: function () { return values_1.DbValues; } });
/** Storage buckets created by the migrations. */
exports.StorageBuckets = {
    mealPhotos: 'meal-photos',
    taskPhotos: 'task-photos',
    exerciseMedia: 'exercise-media',
};
