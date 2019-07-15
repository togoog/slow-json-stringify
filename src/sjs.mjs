import _prepareString from './_prepareString';
import _makeQueue from './_makeQueue';
import _makeChunks from './_makeChunks';
import { _makeArr, escape } from './_utils';

const select = chunks => (value, index) => {
  const { pure, flag, isUndef, prevUndef, bothUndef } = chunks[index];

  if (typeof value !== 'undefined') {
    if (flag) {
      return prevUndef + value;
    }
    return pure + value;
  }

  chunks[index + 1].flag = true;

  if (flag) {
    return bothUndef;
  }
  return isUndef;
};


// Doing a lot of preparation work before returning the final function responsible for
// the stringification.
const sjs = (schema) => {
  const preparedString = _prepareString(schema);
  const preparedSchema = JSON.parse(preparedString);

  // Providing preparedSchema for univocal correspondence between created queue and chunks.
  // Provided original schema to keep track of the original properties that gets destroied
  // during schema preparation => e.g. array stringification method.
  const queue = _makeQueue(preparedSchema, schema);
  const { length } = queue;

  const chunks = _makeChunks(preparedString, queue);
  const selectChunk = select(chunks);

  // Exposed function
  return (obj) => {
    let temp = '';

    // Ditching old implementation for a **MUCH** faster while
    let i = 0;
    while (true) {
      if (i === length) break;
      const { method, isArray, find } = queue[i];
      const raw = find(obj);

      // An array needs a different treatment
      // => This will make possible the stringification of an arbitrary number of arrais
      const ready = isArray
        ? _makeArr(raw, method)
        : raw;
      temp += selectChunk(ready, i);

      i += 1;
    }

    const { flag, pure, prevUndef } = chunks[chunks.length - 1];

    return temp + (flag ? prevUndef : pure);
  };
};

export {
  sjs,
  escape,
};
