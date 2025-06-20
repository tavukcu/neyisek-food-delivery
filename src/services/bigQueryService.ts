import { BigQuery } from '@google-cloud/bigquery';

// BigQuery yapılandırması
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Service account key dosyası
});

export class BigQueryService {
  private static datasetId = 'neyisek_analytics';
  private static tablesConfig = {
    orders: 'orders_data',
    users: 'users_data', 
    restaurants: 'restaurants_data',
    products: 'products_data',
    user_behavior: 'user_behavior_data'
  };

  // Dataset ve tabloları oluştur
  static async initializeDataset() {
    try {
      const dataset = bigquery.dataset(this.datasetId);
      const [exists] = await dataset.exists();
      
      if (!exists) {
        await dataset.create({
          location: 'europe-west1', // Avrupa bölgesi
        });
        console.log(`Dataset ${this.datasetId} oluşturuldu.`);
      }

      // Tabloları oluştur
      await this.createTables();
    } catch (error) {
      console.error('BigQuery dataset oluşturma hatası:', error);
    }
  }

  // Tabloları oluştur
  private static async createTables() {
    const schemas = {
      orders: [
        { name: 'order_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'restaurant_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'total_amount', type: 'FLOAT', mode: 'REQUIRED' },
        { name: 'order_date', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'status', type: 'STRING', mode: 'REQUIRED' },
        { name: 'delivery_time', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'items', type: 'JSON', mode: 'REPEATED' },
        { name: 'payment_method', type: 'STRING', mode: 'NULLABLE' },
        { name: 'city', type: 'STRING', mode: 'NULLABLE' },
        { name: 'district', type: 'STRING', mode: 'NULLABLE' }
      ],
      users: [
        { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'email', type: 'STRING', mode: 'REQUIRED' },
        { name: 'registration_date', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'last_login', type: 'TIMESTAMP', mode: 'NULLABLE' },
        { name: 'total_orders', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'total_spent', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'favorite_categories', type: 'STRING', mode: 'REPEATED' },
        { name: 'city', type: 'STRING', mode: 'NULLABLE' },
        { name: 'age_group', type: 'STRING', mode: 'NULLABLE' }
      ],
      restaurants: [
        { name: 'restaurant_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'name', type: 'STRING', mode: 'REQUIRED' },
        { name: 'category', type: 'STRING', mode: 'REQUIRED' },
        { name: 'city', type: 'STRING', mode: 'REQUIRED' },
        { name: 'district', type: 'STRING', mode: 'REQUIRED' },
        { name: 'registration_date', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'total_orders', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'total_revenue', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'average_rating', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'active_products', type: 'INTEGER', mode: 'NULLABLE' }
      ],
      products: [
        { name: 'product_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'restaurant_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'name', type: 'STRING', mode: 'REQUIRED' },
        { name: 'category', type: 'STRING', mode: 'REQUIRED' },
        { name: 'price', type: 'FLOAT', mode: 'REQUIRED' },
        { name: 'total_orders', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'total_revenue', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'average_rating', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'created_date', type: 'TIMESTAMP', mode: 'REQUIRED' }
      ],
      user_behavior: [
        { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'event_type', type: 'STRING', mode: 'REQUIRED' }, // page_view, product_view, add_to_cart, etc.
        { name: 'event_data', type: 'JSON', mode: 'NULLABLE' },
        { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
        { name: 'session_id', type: 'STRING', mode: 'NULLABLE' },
        { name: 'device_type', type: 'STRING', mode: 'NULLABLE' },
        { name: 'browser', type: 'STRING', mode: 'NULLABLE' }
      ]
    };

    for (const [tableName, schema] of Object.entries(schemas)) {
      try {
        const table = bigquery.dataset(this.datasetId).table(this.tablesConfig[tableName as keyof typeof this.tablesConfig]);
        const [exists] = await table.exists();
        
        if (!exists) {
          await table.create({ schema });
          console.log(`Tablo ${tableName} oluşturuldu.`);
        }
      } catch (error) {
        console.error(`Tablo ${tableName} oluşturma hatası:`, error);
      }
    }
  }

  // Sipariş verisi ekle
  static async insertOrderData(orderData: any) {
    try {
      const table = bigquery.dataset(this.datasetId).table(this.tablesConfig.orders);
      
      const row = {
        order_id: orderData.id,
        user_id: orderData.userId,
        restaurant_id: orderData.restaurantId,
        total_amount: orderData.totalAmount,
        order_date: new Date(orderData.createdAt),
        status: orderData.status,
        delivery_time: orderData.deliveryTime || null,
        items: orderData.items,
        payment_method: orderData.paymentMethod || null,
        city: orderData.city || null,
        district: orderData.district || null
      };

      await table.insert([row]);
      console.log('Sipariş verisi BigQuery\'ye eklendi:', orderData.id);
    } catch (error) {
      console.error('BigQuery sipariş verisi ekleme hatası:', error);
    }
  }

  // Kullanıcı davranışı verisi ekle
  static async insertUserBehavior(behaviorData: {
    userId: string;
    eventType: string;
    eventData?: any;
    sessionId?: string;
    deviceType?: string;
    browser?: string;
  }) {
    try {
      const table = bigquery.dataset(this.datasetId).table(this.tablesConfig.user_behavior);
      
      const row = {
        event_id: `${behaviorData.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: behaviorData.userId,
        event_type: behaviorData.eventType,
        event_data: behaviorData.eventData || null,
        timestamp: new Date(),
        session_id: behaviorData.sessionId || null,
        device_type: behaviorData.deviceType || null,
        browser: behaviorData.browser || null
      };

      await table.insert([row]);
    } catch (error) {
      console.error('BigQuery kullanıcı davranışı ekleme hatası:', error);
    }
  }

  // Günlük sipariş analizi
  static async getDailyOrderAnalytics(startDate: string, endDate: string) {
    try {
      const query = `
        SELECT 
          DATE(order_date) as order_day,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value,
          COUNT(DISTINCT user_id) as unique_customers,
          COUNT(DISTINCT restaurant_id) as active_restaurants
        FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
        WHERE DATE(order_date) BETWEEN @start_date AND @end_date
        GROUP BY order_day
        ORDER BY order_day DESC
      `;

      const options = {
        query,
        params: {
          start_date: startDate,
          end_date: endDate
        }
      };

      const [rows] = await bigquery.query(options);
      return rows;
    } catch (error) {
      console.error('BigQuery günlük analiz hatası:', error);
      return [];
    }
  }

  // En popüler ürünler analizi
  static async getPopularProductsAnalysis(limit: number = 20) {
    try {
      const query = `
        WITH product_stats AS (
          SELECT 
            JSON_EXTRACT_SCALAR(item, '$.productId') as product_id,
            JSON_EXTRACT_SCALAR(item, '$.name') as product_name,
            JSON_EXTRACT_SCALAR(item, '$.category') as category,
            COUNT(*) as order_count,
            SUM(CAST(JSON_EXTRACT_SCALAR(item, '$.price') AS FLOAT64)) as total_revenue,
            AVG(CAST(JSON_EXTRACT_SCALAR(item, '$.price') AS FLOAT64)) as avg_price
          FROM \`${this.datasetId}.${this.tablesConfig.orders}\`,
          UNNEST(JSON_EXTRACT_ARRAY(items)) as item
          WHERE DATE(order_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
          GROUP BY product_id, product_name, category
        )
        SELECT *
        FROM product_stats
        ORDER BY order_count DESC
        LIMIT @limit
      `;

      const options = {
        query,
        params: { limit }
      };

      const [rows] = await bigquery.query(options);
      return rows;
    } catch (error) {
      console.error('BigQuery popüler ürünler analizi hatası:', error);
      return [];
    }
  }

  // Restoran performans analizi
  static async getRestaurantPerformance(restaurantId?: string) {
    try {
      const whereClause = restaurantId ? 'WHERE restaurant_id = @restaurant_id' : '';
      
      const query = `
        SELECT 
          restaurant_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value,
          COUNT(DISTINCT user_id) as unique_customers,
          AVG(delivery_time) as avg_delivery_time,
          COUNT(DISTINCT DATE(order_date)) as active_days
        FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
        ${whereClause}
        GROUP BY restaurant_id
        ORDER BY total_revenue DESC
      `;

      const options = {
        query,
        params: restaurantId ? { restaurant_id: restaurantId } : {}
      };

      const [rows] = await bigquery.query(options);
      return rows;
    } catch (error) {
      console.error('BigQuery restoran performans analizi hatası:', error);
      return [];
    }
  }

  // Kullanıcı segmentasyonu
  static async getUserSegmentation() {
    try {
      const query = `
        WITH user_stats AS (
          SELECT 
            user_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_spent,
            AVG(total_amount) as avg_order_value,
            DATE_DIFF(CURRENT_DATE(), DATE(MAX(order_date)), DAY) as days_since_last_order,
            DATE_DIFF(CURRENT_DATE(), DATE(MIN(order_date)), DAY) as customer_lifetime_days
          FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
          GROUP BY user_id
        ),
        segmented_users AS (
          SELECT 
            user_id,
            total_orders,
            total_spent,
            avg_order_value,
            days_since_last_order,
            customer_lifetime_days,
            CASE 
              WHEN total_orders >= 20 AND total_spent >= 1000 THEN 'VIP'
              WHEN total_orders >= 10 AND total_spent >= 500 THEN 'Loyal'
              WHEN total_orders >= 5 AND total_spent >= 200 THEN 'Regular'
              WHEN days_since_last_order <= 30 THEN 'Active'
              WHEN days_since_last_order <= 90 THEN 'At Risk'
              ELSE 'Inactive'
            END as segment
          FROM user_stats
        )
        SELECT 
          segment,
          COUNT(*) as user_count,
          AVG(total_orders) as avg_orders,
          AVG(total_spent) as avg_spent,
          AVG(avg_order_value) as avg_order_value
        FROM segmented_users
        GROUP BY segment
        ORDER BY avg_spent DESC
      `;

      const [rows] = await bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('BigQuery kullanıcı segmentasyonu hatası:', error);
      return [];
    }
  }

  // Saatlik sipariş dağılımı
  static async getHourlyOrderDistribution() {
    try {
      const query = `
        SELECT 
          EXTRACT(HOUR FROM order_date) as hour,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_order_value
        FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
        WHERE DATE(order_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY hour
        ORDER BY hour
      `;

      const [rows] = await bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('BigQuery saatlik dağılım analizi hatası:', error);
      return [];
    }
  }

  // Coğrafi analiz
  static async getGeographicAnalysis() {
    try {
      const query = `
        SELECT 
          city,
          district,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          COUNT(DISTINCT user_id) as unique_customers,
          COUNT(DISTINCT restaurant_id) as active_restaurants,
          AVG(total_amount) as avg_order_value
        FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
        WHERE city IS NOT NULL AND district IS NOT NULL
        GROUP BY city, district
        ORDER BY total_revenue DESC
      `;

      const [rows] = await bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('BigQuery coğrafi analiz hatası:', error);
      return [];
    }
  }

  // Müşteri yaşam döngüsü analizi
  static async getCustomerLifecycleAnalysis() {
    try {
      const query = `
        WITH customer_journey AS (
          SELECT 
            user_id,
            MIN(order_date) as first_order_date,
            MAX(order_date) as last_order_date,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_spent,
            DATE_DIFF(MAX(order_date), MIN(order_date), DAY) as customer_lifespan_days
          FROM \`${this.datasetId}.${this.tablesConfig.orders}\`
          GROUP BY user_id
        ),
        lifecycle_segments AS (
          SELECT 
            CASE 
              WHEN customer_lifespan_days = 0 THEN 'One-time'
              WHEN customer_lifespan_days <= 30 THEN 'New (0-30 days)'
              WHEN customer_lifespan_days <= 90 THEN 'Growing (31-90 days)'
              WHEN customer_lifespan_days <= 180 THEN 'Established (91-180 days)'
              ELSE 'Mature (180+ days)'
            END as lifecycle_stage,
            COUNT(*) as customer_count,
            AVG(total_orders) as avg_orders,
            AVG(total_spent) as avg_spent,
            AVG(customer_lifespan_days) as avg_lifespan_days
          FROM customer_journey
          GROUP BY lifecycle_stage
        )
        SELECT * FROM lifecycle_segments
        ORDER BY avg_spent DESC
      `;

      const [rows] = await bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('BigQuery müşteri yaşam döngüsü analizi hatası:', error);
      return [];
    }
  }
} 