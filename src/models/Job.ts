import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    title: string;
    company: string;
    location: string;
    link: string;
    platform: 'LinkedIn' | 'Handshake';
    description?: string;
    postedDate?: Date;
    extractedAt: Date;
    tags?: string[];
}

const JobSchema: Schema = new Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: 'Not specified' },
    link: { type: String, required: true, unique: true }, // unique helps us avoid saving duplicate jobs
    platform: { type: String, required: true, enum: ['LinkedIn', 'Handshake'] },
    description: { type: String },
    postedDate: { type: Date },
    extractedAt: { type: Date, default: Date.now },
    tags: [{ type: String }]
}, { timestamps: true });

// Create a compound index so we can search efficiently by platform and company
JobSchema.index({ platform: 1, company: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
