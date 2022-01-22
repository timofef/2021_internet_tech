document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

class AppModel {
  static async getfiller() {
    const fillerRes = await fetch('http://localhost:4321/filler');
    return await fillerRes.json();
  }

  static async addfiller(fillerName) {
    console.log(JSON.stringify({ fillerName }));
    const result = await fetch(
      'http://localhost:4321/filler',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fillerName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async addCar({
    fillerId,
    carName,
    carLocation,
    carRegNum
  }) {
    const result = await fetch(
      `http://localhost:4321/filler/${fillerId}/cars`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ carName, carLocation, carRegNum })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editcar({
    fillerId,
    carId,
    newCarName,
    newCarLocation,
    newCarRegNum
  }) {
    const result = await fetch(
      `http://localhost:4321/filler/${fillerId}/cars/${carId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newCarName, newCarLocation, newCarRegNum })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deletecar({
    fillerId,
    carId
  }) {
    const result = await fetch(
      `http://localhost:4321/filler/${fillerId}/cars/${carId}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async movecar({
    fromfillerId,
    tofillerId,
    carId
  }) {
    const result = await fetch(
      `http://localhost:4321/filler/${fromfillerId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tofillerId, carId })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }
}

class App {
  constructor() {
    this.filler = [];
  }

  onEscapeKeydown = ({ key }) => {
    if (key === 'Escape') {
      const input = document.getElementById('add-filler-input');
      input.style.display = 'none';
      input.value = '';

      document.getElementById('hw-filler-add-filler')
        .style.display = 'inherit';
    }
  };

  onInputKeydown = async ({ key, target }) => {
    if (key === 'Enter') {
      if (target.value) {
        await AppModel.addfiller(target.value);

        this.filler.push(
          new Filler({
            tlName: target.value,
            tlID: `TL${this.filler.length}`,
            movecar: this.movecar
          })
        );

        this.filler[this.filler.length - 1].render();
      }
      
      target.style.display = 'none';
      target.value = '';

      document.getElementById('hw-filler-add-filler')
        .style.display = 'inherit';
    }
  };

  movecar = async ({ carID, direction }) => {
    let [
      tlIndex,
      carIndex
    ] = carID.split('-T');
    tlIndex = Number(tlIndex.split('TL')[1]);
    carIndex = Number(carIndex);
    const car = { carName: this.filler[tlIndex].cars[carIndex].carName,
      carLocation: this.filler[tlIndex].cars[carIndex].carLocation,
      carRegNum: this.filler[tlIndex].cars[carIndex].carRegNum
    };
    const targetTlIndex = direction === 'left'
      ? tlIndex - 1
      : tlIndex + 1;

    try {
      await AppModel.movecar({
        fromfillerId: tlIndex,
        tofillerId: targetTlIndex,
        carId: carIndex
      });

      this.filler[tlIndex].deletecar(carIndex);
      this.filler[targetTlIndex].addCar(car.carName, car.carLocation, car.carRegNum);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  async init() {
    const filler = await AppModel.getfiller();
    filler.forEach(({ fillerName, cars }) => {
      const newfiller = new Filler({
        tlName: fillerName,
        tlID: `TL${this.filler.length}`,
        movecar: this.movecar
      });
      cars.forEach(car => newfiller.cars.push(car));
      
      this.filler.push(newfiller);
      newfiller.render();
      newfiller.rerenderCars();
    });

    document.getElementById('hw-filler-add-filler')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.getElementById('add-filler-input');
          input.style.display = 'inherit';
          input.focus();
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.getElementById('add-filler-input')
      .addEventListener('keydown', this.onInputKeydown);

    document.querySelector('.toggle-switch input')
      .addEventListener(
        'change',
        ({ target: { checked } }) => {
          checked
            ? document.body.classList.add('dark-theme')
            : document.body.classList.remove('dark-theme');
        }
      );
  }
}

class Filler {
  constructor({
    tlName,
    tlID,
    movecar
  }) {
    this.tlName = tlName;
    this.tlID = tlID;
    this.cars = [];
    this.movecar = movecar;
  }

  onAddCarButtonClick = async () => {
    const newCarName = prompt('🚘 Название автомобиля:');
    const newCarLocation = prompt('🌐 Местоположение автомобиля:');
    const newCarRegNum = prompt('📜 Регистрационный номер:');

    if (!newCarName && !newCarLocation && !newCarRegNum) return;

    const fillerId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.addCar({
        fillerId,
        carName: newCarName,
        carLocation: newCarLocation,
        carRegNum: newCarRegNum
      });
      this.addCar(newCarName, newCarLocation, newCarRegNum);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  addCar = (carName, carLocation, carRegNum) => {
    const car = {
      carName: carName,
      carLocation: carLocation,
      carRegNum: carRegNum,
    };

    console.log(car);

    document.querySelector(`#${this.tlID} ul`)
      .appendChild(
        this.renderCar(
          `${this.tlID}-T${this.cars.length}`,
          car
        )
      );

    this.cars.push({carName, carLocation, carRegNum});
  };

  onEditCar = async (carID) => {
    const carIndex = Number(carID.split('-T')[1]);
    const oldCar = this.cars[carIndex];

    const newCarName = prompt('Новое название машины:', oldCar.carName);
    const newCarLocation = prompt('Новое местоположение машины:', oldCar.carLocation);
    const newCarRegNum = prompt('Новый регистрационный номер:', oldCar.carRegNum);

    if ((!newCarName || newCarName === oldCar.carName)
        && (!newCarLocation || newCarLocation === oldCar.carLocation)
        && (!newCarRegNum || newCarRegNum === oldCar.carRegNum)) {
      return;
    }

    const fillerId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.editcar({
        fillerId,
        carId: carIndex,
        newCarName,
        newCarLocation,
        newCarRegNum
      });

      this.cars[carIndex].carName = newCarName;
      this.cars[carIndex].carLocation = newCarLocation;
      this.cars[carIndex].carRegNum = newCarRegNum;
      document.querySelector(`#${carID} span`)
        .innerHTML = `🚘 ${newCarName} <br> 🌐 ${newCarLocation} <br> 📜 ${newCarRegNum}`;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onDeletecarButtonClick = async (carID) => {
    const carIndex = Number(carID.split('-T')[1]);
    const carName = this.cars[carIndex].carName;

    if (!confirm(`Машина '${carName}' будет удалена. Продолжить?`)) return;

    const fillerId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.deletecar({
        fillerId,
        carId: carIndex
      });

      this.deletecar(carIndex);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  deletecar = (carIndex) => {
    this.cars.splice(carIndex, 1);
    this.rerenderCars();
  };

  rerenderCars = () => {
    const filler = document.querySelector(`#${this.tlID} ul`);
    filler.innerHTML = '';

    this.cars.forEach((car, carIndex) => {
      filler.appendChild(
        this.renderCar(
          `${this.tlID}-T${carIndex}`,
          car
        )
      );
    });
  };

  renderCar = (carID, singleCar) => {
    const car = document.createElement('li');
    car.classList.add('hw-filler-car');
    car.id = carID;
    
    const span = document.createElement('span');
    span.classList.add('hw-filler-car-text');
    span.innerHTML = `🚘 ${singleCar.carName} <br> 🌐 ${singleCar.carLocation} <br> 📜 ${singleCar.carRegNum}`;
    car.appendChild(span);

    const controls = document.createElement('div');
    controls.classList.add('hw-filler-car-controls');

    const upperRow = document.createElement('div');
    upperRow.classList.add('hw-filler-car-controls-row');

    const leftArrow = document.createElement('button');
    leftArrow.type = 'button';
    leftArrow.classList.add(
      'hw-filler-car-controls-button',
      'left-arrow'
    );
    leftArrow.addEventListener(
      'click',
      () => this.movecar({ carID, direction: 'left' })
    );
    upperRow.appendChild(leftArrow);

    const rightArrow = document.createElement('button');
    rightArrow.type = 'button';
    rightArrow.classList.add(
      'hw-filler-car-controls-button',
      'right-arrow'
    );
    rightArrow.addEventListener(
      'click',
      () => this.movecar({ carID, direction: 'right' })
    );
    upperRow.appendChild(rightArrow);

    controls.appendChild(upperRow);

    const lowerRow = document.createElement('div');
    lowerRow.classList.add('hw-filler-car-controls-row');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add(
      'hw-filler-car-controls-button',
      'edit-icon'
    );
    editButton.addEventListener('click', () => this.onEditCar(carID));
    lowerRow.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add(
      'hw-filler-car-controls-button',
      'delete-icon'
    );
    deleteButton.addEventListener('click', () => this.onDeletecarButtonClick(carID));
    lowerRow.appendChild(deleteButton);

    controls.appendChild(lowerRow);

    car.appendChild(controls);

    return car;
  };

  render() {
    const filler = document.createElement('div');
    filler.classList.add('hw-filler');
    filler.id = this.tlID;

    const header = document.createElement('header');
    header.classList.add('hw-filler-header');
    header.innerHTML = this.tlName;
    filler.appendChild(header);

    const list = document.createElement('ul');
    list.classList.add('hw-filler-cars');
    filler.appendChild(list);

    const footer = document.createElement('footer');
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('hw-filler-add-car');
    button.innerHTML = 'Добавить машину';
    button.addEventListener('click', this.onAddCarButtonClick);
    footer.appendChild(button);
    filler.appendChild(footer);

    const container = document.querySelector('main');
    container.insertBefore(filler, container.lastElementChild);
  }
}
