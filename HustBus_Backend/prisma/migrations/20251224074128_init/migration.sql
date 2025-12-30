-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" VARCHAR(50) NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" VARCHAR(50) NOT NULL,
    "short_name" TEXT,
    "long_name" TEXT,
    "type" VARCHAR(10),
    "fare" INTEGER,
    "forward_direction" BOOLEAN,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_routes" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT,
    "from_stop" VARCHAR(50),
    "to_stop" VARCHAR(50),
    "saved_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "route_id" VARCHAR(255),
    "mode" VARCHAR(50),
    "options" TEXT,
    "route_data" JSONB,

    CONSTRAINT "saved_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_times" (
    "trip_id" VARCHAR(50) NOT NULL,
    "stop_id" VARCHAR(50),
    "arrival_time" TIME(6),
    "departure_time" TIME(6),
    "stop_sequence" INTEGER NOT NULL,

    CONSTRAINT "stop_times_pkey" PRIMARY KEY ("trip_id","stop_sequence")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" VARCHAR(50) NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "type" VARCHAR(10),

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "trip_id" VARCHAR(50) NOT NULL,
    "route_id" VARCHAR(50),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("trip_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "path_url" TEXT,
    "role" VARCHAR(10) DEFAULT 'user',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reviews_target" ON "reviews"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_saved_routes_user_route" ON "saved_routes"("user_id", "route_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saved_routes" ADD CONSTRAINT "saved_routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stop_times" ADD CONSTRAINT "stop_times_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stop_times" ADD CONSTRAINT "stop_times_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
