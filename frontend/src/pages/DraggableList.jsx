import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const DraggableList = ({ items, setItems }) => {
    const handleOnDragEnd = (result) => {
        console.log("📦 Drag result:", result);

        if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="przystanki">
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <li
                    className="p-2 bg-gray-100 rounded shadow cursor-move"
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-600">
                      Lat: {item.lat ?? 'Brak'}, Lng: {item.lng ?? 'Brak'}
                    </div>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableList;
