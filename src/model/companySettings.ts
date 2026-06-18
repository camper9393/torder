import mongoose from "mongoose";

export interface ICompanySettings {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  nameMn: string;
  nameEn: string;
  logoUrl: string;
  businessType: string;
  introduction: string;
  description: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  address: string;
  googleMapLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingsSchema = new mongoose.Schema<ICompanySettings>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      unique: true,
      index: true,
    },
    nameMn: { type: String, default: "", trim: true },
    nameEn: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    businessType: { type: String, default: "", trim: true },
    introduction: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    phone1: { type: String, default: "", trim: true },
    phone2: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    googleMapLink: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const CompanySettings =
  mongoose.models.company_settings ||
  mongoose.model<ICompanySettings>("company_settings", companySettingsSchema);
