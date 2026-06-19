import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index,
} from 'typeorm';

export enum LaunchStatus {
  ACTIVE = 'active',
  MIGRATED = 'migrated',
  CANCELLED = 'cancelled',
}

@Entity('launches')
export class Launch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  tokenAddress: string;

  @Column()
  creator: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'bigint', default: 0 })
  totalSupply: bigint;

  @Column({ type: 'bigint', default: 0 })
  targetMarketCap: bigint;

  @Column({ type: 'bigint', default: 0 })
  raisedXlm: bigint;

  @Column({ type: 'bigint', default: 0 })
  soldTokens: bigint;

  @Column({ type: 'enum', enum: LaunchStatus, default: LaunchStatus.ACTIVE })
  status: LaunchStatus;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'float', default: 0 })
  priceChange24h: number;

  @Column({ type: 'bigint', default: 0 })
  volume24h: bigint;

  @Column({ type: 'int', default: 0 })
  holderCount: number;

  @Column({ nullable: true })
  txHash: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', nullable: true })
  launchId: bigint;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  migratedAt: Date;
}
