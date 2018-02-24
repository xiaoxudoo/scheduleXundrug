const Subscription = require('egg').Subscription;

class Calculation extends Subscription {
	// 通过 schedule 属性来设置定时任务的执行间隔等配置
	static get schedule() {
		return {
			interval: '10s', // 1 分钟间隔
			type: 'worker', // 指定所有的 worker 都需要执行
		};
	}

	// subscribe 是真正定时任务执行时被运行的函数
	async subscribe() {
		const inOneDay = new Date().getTime() - 24 * 3600 * 1000;

		const queueOrders = await this.ctx.app.mysql.query('SELECT id_, parameters FROM xundrug_order WHERE status=? AND createTime>? ORDER BY createTime ASC', ['1', inOneDay]);

		if (queueOrders.length > 0) {
			const orderId = queueOrders[0].id_;
			const parameters = JSON.parse(queueOrders[0].parameters);
			// 调用python计算
			const { exec } = require('child_process');
			var cmdStr = 'ps -aux | grep python | grep ca_ |wc -l';
			exec(cmdStr, function (err, stdout, stderr) {
				let isRunning = null;
				if (process.env.NODE_ENV === 'production') {
					isRunning = stdout && stdout > 1;
				} else {
					isRunning = stdout && stdout < 1;
				}
				if (!isRunning) { // python计算的加锁条件, 调用python程序直接计算。

					const calTypePy = `../src/xundrug_python/ca_manager.py`; // req.body.runType ? `${python_path}/ca_${req.body.runType}_${routeName}_sql.py` : `${python_path}/ca_${routeName}_sql.py`
        	const { spawn } = require('child_process');

					const py = spawn('python', [calTypePy, orderId]);
					py.on('error', function (err) {
						console.log('error');
						// logger.error(`orderId:${orderId},userid:${userid},status:${status} 调用python失败 => ${err}`);
						process.exit();
					});
				}
			});
		}
	}
}

module.exports = Calculation;