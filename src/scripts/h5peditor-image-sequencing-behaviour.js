/** Class for H5P ImageSequencingBehaviour widget */
export default class ImageSequencingBehaviour {

  /**
   * @constructor
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    // DOM
    this.$container = H5P.jQuery('<div>', {
      class: 'h5peditor-imagesequencingbehaviour'
    });

    // Instantiate original field (or create your own and call setValue)
    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, this.params, this.setValue);
    this.fieldInstance.appendTo(this.$container);

    // Adopt children
    this.children = this.fieldInstance.children;

    // Relay changes
    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    // Errors (or add your own)
    this.$errors = this.$container.find('.h5p-errors');

    this.parent.ready(() => {
      this.handleParentReady();
    });

    // Use H5PEditor.t('H5PEditor.ImageSequencing', 'foo'); to output translatable strings
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    this.$container.appendTo($wrapper);
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @return {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.remove();
  }

  /**
   * Initialize min and max for max columns field.
   */
  initFieldMaxColumns() {
    this.fieldMaxColumns.field = this.fieldMaxColumns.field || {};
    this.fieldMaxColumns.field.min = this.fieldMaxColumns.field.min || 1;
    this.fieldMaxColumns.field.max = Math.max(
      this.fieldMaxColumns.field.min,
      (this.listSequenceImages.getValue() || []).length
    );
  }

  /**
   * Set maximum value for max columns field.
   * @param {number} max Maximum value
   */
  setFieldMaxColumnsMax(max) {
    this.fieldMaxColumns.field.max = Math.max(
      this.fieldMaxColumns.field.min,
      max
    );
  }

  /**
   * Find list of sequencing images.
   * @param {object} parent Parent field.
   */
  findSequenceImages(parent) {
    if (!parent.children) {
      return false;
    }

    const list = parent.children.filter(child => {
      return (
        child instanceof H5PEditor.List &&
        child.getId().indexOf('field-sequenceimages') === 0
      );
    });

    return list.shift() || false;
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach(change => {
      change(this.params);
    });
  }

  /**
   * Handle parent ready.
   */
  handleParentReady() {
    // Add listeners to behavioural settings sequence images list
    this.listSequenceImages = this.findSequenceImages(this.parent);
    this.fieldEnforceColumns = H5PEditor.findField('behaviour/enforceColumns', this.parent);
    this.fieldMaxColumns = H5PEditor.findField('behaviour/maxColumns', this.parent);

    if (this.fieldEnforceColumns && this.fieldMaxColumns && this.listSequenceImages) {
      this.initFieldMaxColumns();

      this.listSequenceImages.on('addedItem', () => {
        this.handleListSequenceImagesChanged();
        this.handleFieldMaxColumnsChanged();
      });
      this.listSequenceImages.on('removedItem', () => {
        // Update max columns field with maximum value
        this.handleListSequenceImagesChanged();

        this.fieldMaxColumns.$input.val(
          (this.listSequenceImages.getValue() || []).length
        );
        this.fieldMaxColumns.$input.change();
      });

      this.fieldEnforceColumns.changes.push((state) => {
        this.handleFieldEnforceColumnsChanged(state);
      });

      this.fieldMaxColumns.$input.on('change', () => {
        this.handleFieldMaxColumnsChanged();
      });

    }
  }

  /**
   * Handle list of sequence images changed (in length).
   */
  handleListSequenceImagesChanged() {
    this.setFieldMaxColumnsMax(
      (this.listSequenceImages.getValue() || []).length
    );
  }

  /**
   * Handle enforce columns field changed.
   * @param {boolean} checked True, if field was checked.
   */
  handleFieldEnforceColumnsChanged(checked) {
    this.fieldMaxColumns.$input.change();

    if (!checked) {
      return; // Field was unchecked
    }

    if (this.fieldMaxColumns.$errors.html().length > 0) {
      return; // Already showing error message
    }

    if (this.fieldMaxColumns.value !== undefined) {
      return; // Everything is fine
    }

    // The maximum number field is empty
    this.fieldMaxColumns.$errors.html(
      `<p>${H5PEditor.t('H5PEditor.ImageSequencingBehaviour', 'maxColumnsRequired')}</p>`
    );
  }

  /**
   * Handle max columns field changed.
   */
  handleFieldMaxColumnsChanged() {
    if (this.fieldMaxColumns.$input.val() > this.fieldMaxColumns.field.max) {
      // Maximum number of columns is larger than sequence image list fields
      this.fieldMaxColumns.$errors.html(
        `<p>${H5PEditor.t('H5PEditor.ImageSequencingBehaviour', 'maxColumnsExceeded')}</p>`
      );
    }
  }
}
