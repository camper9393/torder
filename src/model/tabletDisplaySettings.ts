import mongoose from "mongoose"



export interface ITabletDisplaySettings {

  _id: mongoose.Types.ObjectId

  restaurantId: mongoose.Types.ObjectId

  uiScale: number

  textScale: number

  theme: "dark" | "light" | "warm" | "gold"

  createdAt: Date

  updatedAt: Date

}



const tabletDisplaySettingsSchema = new mongoose.Schema<ITabletDisplaySettings>(

  {

    restaurantId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "restaurants",

      required: true,

      unique: true,

      index: true,

    },

    uiScale: { type: Number, default: 1.35, min: 1, max: 1.75 },

    textScale: { type: Number, default: 1.35, min: 1, max: 1.8 },

    theme: {
      type: String,
      enum: ["dark", "light", "warm", "gold", "premium"],
      default: "dark",
    },

  },

  { timestamps: true }

)



export const TabletDisplaySettings =

  mongoose.models.tablet_display_settings ||

  mongoose.model<ITabletDisplaySettings>(

    "tablet_display_settings",

    tabletDisplaySettingsSchema

  )

