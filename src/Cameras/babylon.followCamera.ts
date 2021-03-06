﻿module BABYLON {
    Node.AddNodeConstructor("FollowCamera", (name, scene) => {
        return () => new FollowCamera(name, Vector3.Zero(), scene);
    });

    Node.AddNodeConstructor("ArcFollowCamera", (name, scene) => {
        return () => new ArcFollowCamera(name, 0, 0, 1.0, null, scene);
    });

    export class FollowCamera extends TargetCamera {
        @serialize()
        public radius: number = 12;

        @serialize()
        public rotationOffset: number = 0;

        @serialize()
        public heightOffset: number = 4;

        @serialize()
        public cameraAcceleration: number = 0.05;

        @serialize()
        public maxCameraSpeed: number = 20;

        @serializeAsMeshReference("lockedTargetId")
        public lockedTarget: Nullable<AbstractMesh>;

        constructor(name: string, position: Vector3, scene: Scene, lockedTarget: Nullable<AbstractMesh> = null) {
            super(name, position, scene);

            this.lockedTarget = lockedTarget;
        }

        private getRadians(degrees: number): number {
            return degrees * Math.PI / 180;
        }

        private follow(cameraTarget: AbstractMesh) {
            if (!cameraTarget)
                return;

            var yRotation;
            if (cameraTarget.rotationQuaternion) {
                var rotMatrix = new Matrix();
                cameraTarget.rotationQuaternion.toRotationMatrix(rotMatrix);
                yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);
            } else {
                yRotation = cameraTarget.rotation.y;
            }
            var radians = this.getRadians(this.rotationOffset) + yRotation;
            var targetPosition = cameraTarget.getAbsolutePosition();
            var targetX: number = targetPosition.x + Math.sin(radians) * this.radius;

            var targetZ: number = targetPosition.z + Math.cos(radians) * this.radius;
            var dx: number = targetX - this.position.x;
            var dy: number = (targetPosition.y + this.heightOffset) - this.position.y;
            var dz: number = (targetZ) - this.position.z;
            var vx: number = dx * this.cameraAcceleration * 2;//this is set to .05
            var vy: number = dy * this.cameraAcceleration;
            var vz: number = dz * this.cameraAcceleration * 2;

            if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
                vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
                vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
                vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            this.position = new Vector3(this.position.x + vx, this.position.y + vy, this.position.z + vz);
            this.setTarget(targetPosition);
        }

        /** @hidden */
        public _checkInputs(): void {
            super._checkInputs();
            if (this.lockedTarget) {
                this.follow(this.lockedTarget);
            }
        }

        public getClassName(): string {
            return "FollowCamera";
        }
    }

    /**
     * Arc Rotate version of the follow camera.
     * It still follows a defined mesh but in an Arc Rotate Camera fashion.
     */
    export class ArcFollowCamera extends TargetCamera {

        private _cartesianCoordinates: Vector3 = Vector3.Zero();

        /**
         * Instantiates a new ArcFollowCamera
         * @param name Defines the name of the camera
         * @param alpha Defines the rotation angle of the camera around the logitudinal axis
         * @param beta Defines the rotation angle of the camera around the elevation axis
         * @param radius Defines the radius of the camera from its target point
         * @param target Defines the target of the camera
         * @param scene Defines the scene the camera belongs to
         */
        constructor(name: string, 
            /** The longitudinal angle of the camera */
            public alpha: number, 
            /** The latitudinal angle of the camera */
            public beta: number, 
            /** The radius of the camera from its target */
            public radius: number, 
            /** Defines the camera target (the messh it should follow) */
            public target: Nullable<AbstractMesh>, 
            scene: Scene) {
            super(name, Vector3.Zero(), scene);
            this.follow();
        }

        private follow(): void {
            if (!this.target) {
                return;
            }
            this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
            this._cartesianCoordinates.y = this.radius * Math.sin(this.beta);
            this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);

            var targetPosition = this.target.getAbsolutePosition();
            this.position = targetPosition.add(this._cartesianCoordinates);
            this.setTarget(targetPosition);
        }

        /** @hidden */
        public _checkInputs(): void {
            super._checkInputs();
            this.follow();
        }

        /**
         * Returns the class name of the object.
         * It is mostly used internally for serialization purposes.
         */
        public getClassName(): string {
            return "ArcFollowCamera";
        }
    }
}


