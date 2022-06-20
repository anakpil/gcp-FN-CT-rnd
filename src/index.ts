import {HttpFunction} from '@google-cloud/functions-framework/build/src/functions';
import {CloudTasksClient} from '@google-cloud/tasks';

// your GCP Project id
const project = 'foyasells-rnd';
// GCP region in which to create the queue
const location = 'us-central1';
// instantiates a client
const client = new CloudTasksClient({
  keyFilename: './foyasells-rnd-0067c30b4c7e.json',
});

const createQueue = async (name: string) => {
  const [response] = await client.createQueue({
    parent: client.locationPath(project, location),
    queue: {
      name: client.queuePath(project, location, name),
    },
  });

  return response;
};

const createTask = async (params: {queueName: string; taskName: string}) => {
  const {queueName, taskName} = params;
  const name = client.taskPath(project, location, queueName, taskName);

  try {
    const [response] = await client.createTask({
      parent: client.queuePath(project, location, queueName),
      task: {
        name,
        httpRequest: {
          httpMethod: 'POST',
          url: 'https://ptsv2.com/t/2nool-1655690223/post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: Buffer.from(JSON.stringify({message: 'Hello World'})).toString(
            'base64'
          ),
        },
      },
    });
    console.log(`Created task ${response.name}`);
  } catch (error) {
    console.error(
      `Error: ${
        (error as Error)?.message || (error as {details: string})?.details
      } (${taskName})`
    );
  }
};

const getQueue = async (name: string) => {
  try {
    const queue = await client.getQueue({
      name: client.queuePath(project, location, name),
    });

    return queue;
  } catch (error) {
    return undefined;
  }
};

export const helloWorld: HttpFunction = async (req, res) => {
  const queueName = 'my-queue';
  const queue = await getQueue(queueName);

  if (!queue?.length) {
    console.log('Creating queue');
    await createQueue(queueName);
  }

  await createTask({queueName, taskName: `my-greeter-task-${+new Date()}`});

  res.send('Hello, World');
};
