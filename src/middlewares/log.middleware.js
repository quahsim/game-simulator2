import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // Set the log level to 'info'
  format: winston.format.json(), // Set the log format to JSON
  transports: [
    new winston.transports.Console(), // Output logs to the console
  ],
});

export default function (req, res, next) {
  // Record the time when the client's request starts
  const start = new Date().getTime();

  // Log the request details once the response is finished
  res.on('finish', () => {
    const duration = new Date().getTime() - start;
    logger.info(
      `Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`,
    );
  });

  next();
}