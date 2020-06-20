import { Document, Model, QueryFindOneAndUpdateOptions } from 'mongoose';
import { Service } from "typedi";

@Service()
export default abstract class BaseModel<M = any> {
  protected model: Model<Document>;

  constructor() {
    this.model = this.getModelForClass();
  }

  getModel(): Model<Document> {
    return this.model;
  }

  isNeedAutoIncrement(): boolean {
    return true;
  }

  getPrimaryKey(): string {
    return '_id';
  }

  transform(doc, ret) {
    return ret;
  }

  abstract getModelForClass(): Model<Document>;
  abstract getName(): string;

  async save(data: M): Promise<M> {
    const m = new this.model(data);
    const saveResult = await m.save();
    return saveResult.toObject({ minimize: false });
  }

  async getById(id: number): Promise<M | null> {
    const getByIdResult = await this.model.findById(id);

    if (getByIdResult) {
      return getByIdResult.toObject({ minimize: false });
    }

    return null;
  }

  async deleteById(id: number): Promise<void> {
    await this.model.findByIdAndRemove(id);
  }

  async findOneAndUpdate(
    conditions: Partial<M>,
    data: Partial<M>,
    options: QueryFindOneAndUpdateOptions = {},
  ): Promise<M | null> {
    const updateResult = await this.model.findOneAndUpdate(conditions, data, { new: true, ...options });

    if (updateResult) {
      return updateResult.toObject({ minimize: false });
    }

    return null;
  }

  async updateMany(conditions: Partial<M>, data: Partial<M>): Promise<void> {
    await this.model.updateMany(conditions, data, { new: true });
  }

  async find(conditions: Partial<M>, select?: string | { [column: string]: number }): Promise<M[]> {
    let documentQuery = this.model.find(conditions);

    if (select) {
      documentQuery = documentQuery.select(select);
    }

    const anies = await documentQuery;

    return this.toObject(anies);
  }

  async distinct(field: string, conditions?: Partial<M>, select?: string | { [column: string]: number }): Promise<M[]> {
    let documentQuery = this.model.distinct(field, conditions);
    if (select) {
      documentQuery = documentQuery.select(select);
    }
    const anies = await documentQuery;
    return anies;
  }

  async findAdvanced(options: {
    conditions: Partial<M>;
    select?: string | { [column: string]: number };
    offset?: number;
    limit?: number;
    sorter?: any;
  }): Promise<M[]> {
    const { conditions, select, offset, limit = 20, sorter } = options;
    let documentQuery = this.model.find(conditions);

    if (select) {
      documentQuery = documentQuery.select(select);
    }

    if (typeof offset === 'number') {
      documentQuery = documentQuery.skip(offset).limit(limit);
    }

    if (sorter) {
      documentQuery = documentQuery.sort(sorter);
    }

    const anies = await documentQuery;

    return this.toObject(anies);
  }

  async findOne(conditions: Partial<M>, select?: string | { [column: string]: number }): Promise<M | null> {
    let documentQuery = this.model.findOne(conditions);

    if (select) {
      documentQuery = documentQuery.select(select);
    }

    const res = await documentQuery;

    if (res) {
      return res.toObject({ minimize: false });
    }

    return null;
  }

  async countDocuments(conditions: Partial<M>): Promise<number> {
    return await this.model.countDocuments(conditions);
  }

  async insertMany(conditions: Partial<M>[]): Promise<M[]> {
    const anies = await this.model.insertMany(conditions);
    return this.toObject(anies);
  }

  async deleteMany(conditions: Partial<M>): Promise<{ n?: number; ok?: number }> {
    const anies = await this.model.deleteMany(conditions);
    return anies;
  }

  async deleteOne(conditions: Partial<M>): Promise<void> {
    await this.model.deleteOne(conditions);
  }

  toObject(list: Document[] = []): M[] {
    return list.map((item) => item.toObject({ minimize: false }));
  }
}
