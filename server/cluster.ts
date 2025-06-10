import cluster from 'cluster';
import { cpus } from 'os';
import { PRODUCTION_CONFIG } from '../production.config';

const numWorkers = Number(process.env.WEB_CONCURRENCY) || PRODUCTION_CONFIG.SERVER.WORKERS;

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`🚀 Master process ${process.pid} starting ${numWorkers} workers`);
  
  // Fork workers
  for (let i = 0; i < Number(numWorkers); i++) {
    const worker = cluster.fork();
    console.log(`👷 Worker ${worker.process.pid} started`);
  }

  // Handle worker deaths
  cluster.on('exit', (worker, code, signal) => {
    console.log(`💀 Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    
    // Restart worker immediately
    const newWorker = cluster.fork();
    console.log(`🔄 New worker ${newWorker.process.pid} started`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Master received SIGTERM, shutting down workers...');
    
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      if (worker) {
        worker.kill('SIGTERM');
      }
    }
    
    setTimeout(() => {
      console.log('💥 Force killing remaining workers');
      process.exit(0);
    }, 10000);
  });

  // Health monitoring
  setInterval(() => {
    const workers = Object.keys(cluster.workers || {}).length;
    console.log(`📊 Active workers: ${workers}/${numWorkers}`);
    
    // Restart dead workers
    if (workers < numWorkers) {
      const missing = numWorkers - workers;
      for (let i = 0; i < missing; i++) {
        const worker = cluster.fork();
        console.log(`🆘 Emergency worker ${worker.process.pid} started`);
      }
    }
  }, 30000);

} else {
  // Worker process - start the actual server
  import('./index.js').catch(console.error);
}